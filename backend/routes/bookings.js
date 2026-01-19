const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Booking = require("../models/Booking");
const User = require("../models/User");
const { auth, authorize } = require("../middleware/auth");
const smsService = require("../services/smsService");
const emailService = require("../services/emailService");
const { upload } = require("../config/imageUpload");
const { uploadMultipleFiles } = require("../config/googleDrive");

// Generate OTP for verification
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ✅ helper for structured log in Render
const logDivider = () =>
  console.log("============================================================");

// ✅ Create Booking (Driver only)
router.post(
  "/",
  auth,
  authorize("driver"),
  upload.array("carImages", 4),
  [
    body("customerPhone").isMobilePhone().withMessage("Invalid phone number"),
    body("customerName").trim().notEmpty().withMessage("Customer name is required"),
    body("vehicleType").isIn(["car", "bike", "suv"]).withMessage("Invalid vehicle type"),
    body("vehicleNumber").trim().notEmpty().withMessage("Vehicle number is required"),
    body("estimatedDuration").isInt({ min: 1 }).withMessage("Invalid duration"),
    body("parkingSpot").optional().trim(),
    body("venue").optional().trim(),
  ],
  async (req, res) => {
    try {
      logDivider();
      console.log("🚀 CREATE BOOKING REQUEST RECEIVED");
      console.log("Driver:", req.user?._id, "Role:", req.user?.role);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("❌ Validation errors:", errors.array());
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        customerPhone,
        customerName,
        customerEmail,
        vehicleType,
        vehicleNumber,
        vehicleModel,
        vehicleColor,
        estimatedDuration,
        parkingSpot,
        venue,
        notes,
        hasValuables,
        valuables,
      } = req.body;

      console.log("✅ Booking payload:", {
        customerPhone,
        customerName,
        customerEmail,
        vehicleType,
        vehicleNumber,
        estimatedDuration,
        venue,
      });

      // Parse valuables if it's a JSON string
      let valuablesList = [];
      if (valuables) {
        try {
          valuablesList = JSON.parse(valuables);
        } catch (e) {
          valuablesList = Array.isArray(valuables) ? valuables : [];
        }
      }

      // Upload images to Google Drive and get URLs
      let imageUrls = [];
      if (req.files && req.files.length > 0) {
        console.log(`📷 Uploading ${req.files.length} images to Google Drive...`);
        imageUrls = await uploadMultipleFiles(req.files);
        console.log("✅ Images uploaded:", imageUrls);
      } else {
        console.log("ℹ No images uploaded in request.");
      }

      const booking = new Booking({
        driver: req.user._id,
        customer: {
          phone: customerPhone,
          name: customerName,
          email: customerEmail || null,
        },
        vehicle: {
          type: vehicleType,
          number: vehicleNumber.toUpperCase(),
          model: vehicleModel,
          color: vehicleColor,
          images: imageUrls,
          hasValuables: hasValuables === "true" || hasValuables === true,
          valuables: valuablesList,
        },
        parking: {
          estimatedDuration: parseInt(estimatedDuration),
        },
        location: {
          parkingSpot,
          venue,
        },
        notes,
        status: "parked",
      });

      await booking.save();
      await booking.populate("driver", "name phone");

      console.log("✅ Booking created in DB:", {
        mongoId: booking._id,
        bookingId: booking.bookingId,
        driverId: booking.driver._id,
        customerPhone: booking.customer.phone,
        status: booking.status,
      });

      // Generate direct access link with token
      const accessLink = `${
        process.env.FRONTEND_URL || "http://localhost:3000"
      }/customer/access/${booking.accessToken}`;

      console.log("🔗 CUSTOMER ACCESS LINK GENERATED");
      console.log("Booking ID:", booking.bookingId);
      console.log("Access Link:", accessLink);

      // Send Email to customer
      if (customerEmail) {
        console.log("📧 Sending Booking Confirmation Email...");
        const emailResult = await emailService.sendBookingConfirmation(
          customerEmail,
          customerName,
          booking.bookingId,
          accessLink,
          vehicleNumber,
          venue
        );
        console.log("📧 Booking Email result:", emailResult);
      } else {
        console.log("⚠ No customer email provided. Skipping booking email.");
      }

      // Send SMS to customer
      console.log("📩 Sending Booking Confirmation SMS...");
      const smsResult = await smsService.sendBookingConfirmation(
        customerPhone,
        booking.bookingId,
        accessLink
      );
      console.log("📩 Booking SMS result:", smsResult);

      // Emit to supervisor dashboard
      const io = req.app.get("io");
      console.log("📡 Emitting 'new-booking' to supervisors...");
      io.to("supervisors").emit("new-booking", {
        booking: booking.toObject(),
      });
      console.log("✅ Socket emitted: new-booking");

      res.status(201).json({
        message: "Booking created successfully",
        booking,
        accessLink,
      });
    } catch (error) {
      console.error("❌ Create booking error:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  }
);

// ✅ Get Driver's Bookings
router.get("/my-bookings", auth, authorize("driver"), async (req, res) => {
  try {
    const { status } = req.query;
    const query = { driver: req.user._id };

    console.log("📥 Fetching bookings for driver:", req.user._id);

    if (status) query.status = status;
    else query.status = { $nin: ["completed", "cancelled"] };

    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .populate("driver", "name phone");

    console.log(`✅ Found ${bookings.length} bookings for driver`);
    res.json({ bookings });
  } catch (error) {
    console.error("❌ Get bookings error:", error);
    res.status(500).json({ message: "Failed to fetch bookings", error: error.message });
  }
});

// ✅ Get All Bookings (Supervisor only)
router.get("/all", auth, authorize("supervisor"), async (req, res) => {
  try {
    const { status, date } = req.query;
    console.log("📥 Supervisor fetching all bookings:", req.user._id);

    const assignedDrivers = await User.find({
      role: "driver",
      supervisor: req.user._id,
    }).select("_id");

    const driverIds = assignedDrivers.map((d) => d._id);

    const query = { driver: { $in: driverIds } };

    if (status) query.status = status;

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.createdAt = { $gte: startDate, $lt: endDate };
    }

    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .populate("driver", "name phone");

    console.log(`✅ Supervisor received ${bookings.length} bookings`);
    res.json({ bookings });
  } catch (error) {
    console.error("❌ Get all bookings error:", error);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
});

// ✅ Get Customer's Bookings
router.get("/customer-bookings", auth, authorize("customer"), async (req, res) => {
  try {
    console.log("📥 Fetching customer bookings:", req.user.phone);

    const bookings = await Booking.find({ "customer.phone": req.user.phone })
      .sort({ createdAt: -1 })
      .populate("driver", "name phone");

    console.log(`✅ Found ${bookings.length} bookings for customer`);
    res.json({ bookings });
  } catch (error) {
    console.error("❌ Get customer bookings error:", error);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
});

// ✅ Get Single Booking
router.get("/:id", async (req, res) => {
  try {
    console.log("📥 Fetch single booking:", req.params.id);

    const booking = await Booking.findById(req.params.id).populate("driver", "name phone");

    if (!booking) {
      console.log("❌ Booking not found");
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json({ booking });
  } catch (error) {
    console.error("❌ Get booking error:", error);
    res.status(500).json({ message: "Failed to fetch booking" });
  }
});

// ✅ Update Booking
router.put("/:id", auth, authorize("driver"), async (req, res) => {
  try {
    console.log("🛠 Update booking request:", req.params.id);

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      console.log("❌ Booking not found");
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.driver.toString() !== req.user._id.toString()) {
      console.log("❌ Unauthorized update attempt");
      return res.status(403).json({ message: "Not authorized to update this booking" });
    }

    const { payment, paymentStatus, notes } = req.body;

    if (payment) booking.payment = { ...booking.payment, ...payment };
    if (paymentStatus) booking.paymentStatus = paymentStatus;
    if (notes) booking.notes = notes;

    await booking.save();
    await booking.populate("driver", "name phone");

    console.log("✅ Booking updated successfully");
    res.json({ message: "Booking updated successfully", booking });
  } catch (error) {
    console.error("❌ Update booking error:", error);
    res.status(500).json({ message: "Failed to update booking", error: error.message });
  }
});

// ✅ Customer Recall Car
router.post("/:id/recall", auth, authorize("customer"), async (req, res) => {
  try {
    logDivider();
    console.log("🚨 Customer Recall request:", req.params.id);

    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.customer.phone !== req.user.phone) return res.status(403).json({ message: "Unauthorized" });
    if (booking.status !== "parked") return res.status(400).json({ message: "Booking cannot be recalled" });

    booking.status = "recall-requested";
    booking.recall.requestedAt = new Date();
    await booking.save();

    const io = req.app.get("io");
    console.log("📡 Emitting recall-request to driver:", booking.driver.toString());

    io.to(`driver-${booking.driver}`).emit("recall-request", {
      bookingId: booking.bookingId,
      booking: booking.toObject(),
    });

    console.log("✅ recall-request emitted");

    res.json({ message: "Recall request sent to driver", booking });
  } catch (error) {
    console.error("❌ Recall error:", error);
    res.status(500).json({ message: "Failed to recall car" });
  }
});

// ✅ Driver: Set Estimated Arrival Time
router.post("/:id/estimate-arrival", auth, authorize("driver"), async (req, res) => {
  try {
    logDivider();
    console.log("🚗 Driver estimate arrival:", req.params.id);

    const { estimatedMinutes } = req.body;

    if (!estimatedMinutes || estimatedMinutes < 1) {
      return res.status(400).json({ message: "Invalid estimated time" });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.driver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    booking.status = "in-transit";
    booking.recall.estimatedArrival = parseInt(estimatedMinutes);
    await booking.save();

    const io = req.app.get("io");

    console.log("📡 Emitting car-in-transit to customer:", booking.customer.phone);
    io.to(`customer-${booking.customer.phone}`).emit("car-in-transit", {
      bookingId: booking.bookingId,
      estimatedMinutes,
    });
    console.log("✅ Socket emitted: car-in-transit");

    // Email
    if (booking.customer.email) {
      console.log("📧 Sending Recall Email...");
      const emailResult = await emailService.sendRecallNotification(
        booking.customer.email,
        booking.customer.name,
        booking.bookingId,
        estimatedMinutes
      );
      console.log("📧 Recall Email result:", emailResult);
    } else {
      console.log("⚠ No customer email. Skipping recall email.");
    }

    // SMS
    console.log("📩 Sending Recall SMS...");
    const smsResult = await smsService.sendRecallNotification(
      booking.customer.phone,
      booking.bookingId,
      estimatedMinutes
    );
    console.log("📩 Recall SMS result:", smsResult);

    res.json({ message: "Estimated arrival time set", booking });
  } catch (error) {
    console.error("❌ Set arrival error:", error);
    res.status(500).json({ message: "Failed to set arrival time" });
  }
});

// ✅ Driver: Mark as Arrived
router.post("/:id/arrived", auth, authorize("driver"), async (req, res) => {
  try {
    logDivider();
    console.log("🚘 Driver mark arrived:", req.params.id);

    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.driver.toString() !== req.user._id.toString()) return res.status(403).json({ message: "Unauthorized" });

    const otp = generateOTP();
    booking.status = "arrived";
    booking.recall.arrivedAt = new Date();
    booking.verification.otp = otp;
    booking.verification.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await booking.save();

    const io = req.app.get("io");

    console.log("📡 Emitting car-arrived to customer:", booking.customer.phone);
    io.to(`customer-${booking.customer.phone}`).emit("car-arrived", {
      bookingId: booking.bookingId,
      otp,
    });
    console.log("✅ Socket emitted: car-arrived");

    // Email OTP
    if (booking.customer.email) {
      console.log("📧 Sending Arrival OTP Email...");
      const emailResult = await emailService.sendArrivalNotification(
        booking.customer.email,
        booking.customer.name,
        booking.bookingId,
        otp
      );
      console.log("📧 Arrival Email result:", emailResult);
    } else {
      console.log("⚠ No customer email. Skipping arrival email.");
    }

    // SMS OTP
    console.log("📩 Sending Arrival OTP SMS...");
    const smsResult = await smsService.sendArrivalNotification(
      booking.customer.phone,
      booking.bookingId,
      otp
    );
    console.log("📩 Arrival SMS result:", smsResult);

    res.json({
      message: "Arrival confirmed. OTP sent to customer.",
      otp, // for testing
      booking,
    });
  } catch (error) {
    console.error("❌ Mark arrived error:", error);
    res.status(500).json({ message: "Failed to mark as arrived" });
  }
});

// ✅ Driver: Verify OTP and Complete
router.post(
  "/:id/verify-complete",
  auth,
  authorize("driver"),
  [
    body("otp").isLength({ min: 6, max: 6 }).withMessage("Invalid OTP"),
    body("paymentMethod").isIn(["cash", "qr"]).withMessage("Invalid payment method"),
    body("amount").isFloat({ min: 0 }).withMessage("Invalid amount"),
  ],
  async (req, res) => {
    try {
      logDivider();
      console.log("✅ Verify OTP + complete booking:", req.params.id);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("❌ Validation errors:", errors.array());
        return res.status(400).json({ errors: errors.array() });
      }

      const { otp, paymentMethod, amount } = req.body;
      const booking = await Booking.findById(req.params.id);

      if (!booking) return res.status(404).json({ message: "Booking not found" });
      if (booking.driver.toString() !== req.user._id.toString()) return res.status(403).json({ message: "Unauthorized" });

      if (booking.verification.otp !== otp) return res.status(401).json({ message: "Invalid OTP" });
      if (new Date() > booking.verification.otpExpiry) return res.status(401).json({ message: "OTP expired" });

      booking.status = "completed";
      booking.verification.verified = true;
      booking.payment.method = paymentMethod;
      booking.payment.amount = parseFloat(amount);
      booking.payment.paidAt = new Date();
      booking.parking.actualEndTime = new Date();
      await booking.save();

      const io = req.app.get("io");
      console.log("📡 Emitting booking-completed to customer:", booking.customer.phone);
      io.to(`customer-${booking.customer.phone}`).emit("booking-completed", {
        bookingId: booking.bookingId,
      });

      console.log("✅ Booking completed:", booking.bookingId);

      res.json({ message: "Booking completed successfully", booking });
    } catch (error) {
      console.error("❌ Complete booking error:", error);
      res.status(500).json({ message: "Failed to complete booking" });
    }
  }
);

// ✅ Supervisor Stats
router.get("/stats/overview", auth, authorize("supervisor"), async (req, res) => {
  try {
    console.log("📊 Supervisor stats request:", req.user._id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await Booking.aggregate([
      {
        $facet: {
          today: [{ $match: { createdAt: { $gte: today } } }, { $count: "count" }],
          active: [{ $match: { status: { $nin: ["completed", "cancelled"] } } }, { $count: "count" }],
          completed: [{ $match: { status: "completed" } }, { $count: "count" }],
          revenue: [
            { $match: { status: "completed", "payment.amount": { $exists: true } } },
            { $group: { _id: null, total: { $sum: "$payment.amount" } } },
          ],
        },
      },
    ]);

    res.json({
      todayBookings: stats[0].today[0]?.count || 0,
      activeBookings: stats[0].active[0]?.count || 0,
      completedBookings: stats[0].completed[0]?.count || 0,
      totalRevenue: stats[0].revenue[0]?.total || 0,
    });
  } catch (error) {
    console.error("❌ Get stats error:", error);
    res.status(500).json({ message: "Failed to fetch statistics" });
  }
});

module.exports = router;
