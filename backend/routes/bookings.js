const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const smsService = require('../services/smsService');
const emailService = require('../services/emailService');
const { upload } = require('../config/imageUpload');
const { uploadMultipleFiles } = require('../config/googleDrive');

// Generate OTP for verification
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Create Booking (Driver only)
router.post('/',
  auth,
  authorize('driver'),
  upload.array('carImages', 4), // Allow up to 4 images
  [
    body('customerPhone').isMobilePhone().withMessage('Invalid phone number'),
    body('customerName').trim().notEmpty().withMessage('Customer name is required'),
    body('vehicleType').isIn(['car', 'bike', 'suv']).withMessage('Invalid vehicle type'),
    body('vehicleNumber').trim().notEmpty().withMessage('Vehicle number is required'),
    body('estimatedDuration').isInt({ min: 1 }).withMessage('Invalid duration'),
    body('parkingSpot').optional().trim(),
    body('venue').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
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
        valuables
      } = req.body;

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
        console.log(`Uploading ${req.files.length} images to Google Drive...`);
        imageUrls = await uploadMultipleFiles(req.files);
        console.log('Images uploaded:', imageUrls);
      }

      const booking = new Booking({
        driver: req.user._id,
        customer: {
          phone: customerPhone,
          name: customerName,
          email: customerEmail || null
        },
        vehicle: {
          type: vehicleType,
          number: vehicleNumber.toUpperCase(),
          model: vehicleModel,
          color: vehicleColor,
          images: imageUrls,
          hasValuables: hasValuables === 'true' || hasValuables === true,
          valuables: valuablesList
        },
        parking: {
          estimatedDuration: parseInt(estimatedDuration)
        },
        location: {
          parkingSpot,
          venue
        },
        notes,
        status: 'parked'
      });

      await booking.save();
      await booking.populate('driver', 'name phone');

      console.log('Booking created:', { 
        id: booking._id, 
        bookingId: booking.bookingId, 
        driver: booking.driver._id,
        customer: booking.customer.phone,
        status: booking.status
      });

      // Generate direct access link with token
      const accessLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/customer/access/${booking.accessToken}`;

      // Send Email to customer (if email provided)
      if (customerEmail) {
        await emailService.sendBookingConfirmation(
          customerEmail,
          customerName,
          booking.bookingId,
          accessLink,
          vehicleNumber,
          venue
        );
      }

      // Send SMS to customer (backup notification or primary if no email)
      await smsService.sendBookingConfirmation(customerPhone, booking.bookingId, accessLink);

      // Emit to supervisor dashboard
      const io = req.app.get('io');
      io.to('supervisors').emit('new-booking', {
        booking: booking.toObject()
      });

      res.status(201).json({
        message: 'Booking created successfully',
        booking,
        accessLink
      });
    } catch (error) {
      console.error('Create booking error:', error);
      res.status(500).json({ message: 'Failed to create booking' });
    }
  }
);

// Get Driver's Bookings
router.get('/my-bookings', auth, authorize('driver'), async (req, res) => {
  try {
    const { status } = req.query;
    const query = { driver: req.user._id };
    
    console.log('Fetching bookings for driver:', req.user._id);
    
    if (status) {
      query.status = status;
    } else {
      // By default, exclude completed bookings
      query.status = { $nin: ['completed', 'cancelled'] };
    }

    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .populate('driver', 'name phone');

    console.log(`Found ${bookings.length} bookings for driver`);
    res.json({ bookings });
  } catch (error) {
    console.error('Get bookings error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ message: 'Failed to fetch bookings', error: error.message });
  }
});

// Get All Bookings (Supervisor only - shows only their assigned drivers' bookings)
router.get('/all', auth, authorize('supervisor'), async (req, res) => {
  try {
    const { status, date } = req.query;
    
    // Find all drivers assigned to this supervisor
    const assignedDrivers = await User.find({ 
      role: 'driver', 
      supervisor: req.user._id 
    }).select('_id');
    
    const driverIds = assignedDrivers.map(d => d._id);
    
    const query = {
      driver: { $in: driverIds }
    };

    if (status) {
      query.status = status;
    }

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.createdAt = { $gte: startDate, $lt: endDate };
    }

    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .populate('driver', 'name phone');

    res.json({ bookings });
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
});

// Get Customer's Bookings
router.get('/customer-bookings', auth, authorize('customer'), async (req, res) => {
  try {
    const bookings = await Booking.find({ 'customer.phone': req.user.phone })
      .sort({ createdAt: -1 })
      .populate('driver', 'name phone');

    res.json({ bookings });
  } catch (error) {
    console.error('Get customer bookings error:', error);
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
});

// Get Single Booking (Public with booking ID)
router.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('driver', 'name phone');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json({ booking });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ message: 'Failed to fetch booking' });
  }
});

// Update Booking (Driver only - for payment and other updates)
router.put('/:id', auth, authorize('driver'), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify driver owns this booking
    if (booking.driver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this booking' });
    }

    // Update allowed fields
    const { payment, paymentStatus, notes } = req.body;

    if (payment) {
      booking.payment = { ...booking.payment, ...payment };
    }

    if (paymentStatus) {
      booking.paymentStatus = paymentStatus;
    }

    if (notes) {
      booking.notes = notes;
    }

    await booking.save();
    await booking.populate('driver', 'name phone');

    res.json({ 
      message: 'Booking updated successfully',
      booking 
    });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ message: 'Failed to update booking', error: error.message });
  }
});

// Customer Recall Car
router.post('/:id/recall', auth, authorize('customer'), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.customer.phone !== req.user.phone) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (booking.status !== 'parked') {
      return res.status(400).json({ message: 'Booking cannot be recalled' });
    }

    booking.status = 'recall-requested';
    booking.recall.requestedAt = new Date();
    await booking.save();

    // Notify driver via socket
    const io = req.app.get('io');
    io.to(`driver-${booking.driver}`).emit('recall-request', {
      bookingId: booking.bookingId,
      booking: booking.toObject()
    });

    res.json({ 
      message: 'Recall request sent to driver',
      booking 
    });
  } catch (error) {
    console.error('Recall error:', error);
    res.status(500).json({ message: 'Failed to recall car' });
  }
});

// Driver: Initiate Recall
router.post('/:id/driver-recall', auth, authorize('driver'), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.driver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (booking.status !== 'parked') {
      return res.status(400).json({ message: 'Booking cannot be recalled' });
    }

    booking.status = 'recall-requested';
    booking.recall.requestedAt = new Date();
    await booking.save();

    res.json({ 
      message: 'Recall initiated. Set arrival time.',
      booking 
    });
  } catch (error) {
    console.error('Driver recall error:', error);
    res.status(500).json({ message: 'Failed to recall car' });
  }
});

// Driver: Set Estimated Arrival Time
router.post('/:id/estimate-arrival', auth, authorize('driver'), async (req, res) => {
  try {
    const { estimatedMinutes } = req.body;

    if (!estimatedMinutes || estimatedMinutes < 1) {
      return res.status(400).json({ message: 'Invalid estimated time' });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.driver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    booking.status = 'in-transit';
    booking.recall.estimatedArrival = parseInt(estimatedMinutes);
    await booking.save();

    // Notify customer
    const io = req.app.get('io');
    io.to(`customer-${booking.customer.phone}`).emit('car-in-transit', {
      bookingId: booking.bookingId,
      estimatedMinutes
    });

    // Send Email notification (if email available)
    if (booking.customer.email) {
      await emailService.sendRecallNotification(
        booking.customer.email,
        booking.customer.name,
        booking.bookingId,
        estimatedMinutes
      );
    }

    // Send SMS notification (backup or primary if no email)
    await smsService.sendRecallNotification(
      booking.customer.phone,
      booking.bookingId,
      estimatedMinutes
    );

    res.json({ 
      message: 'Estimated arrival time set',
      booking 
    });
  } catch (error) {
    console.error('Set arrival error:', error);
    res.status(500).json({ message: 'Failed to set arrival time' });
  }
});

// Driver: Mark as Arrived
router.post('/:id/arrived', auth, authorize('driver'), async (req, res) => {
  try {
    console.log('Mark arrived request:', { 
      bookingId: req.params.id, 
      userId: req.user._id, 
      userRole: req.user.role 
    });
    
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      console.log('Booking not found:', req.params.id);
      return res.status(404).json({ message: 'Booking not found' });
    }

    console.log('Booking found:', { 
      bookingDriver: booking.driver.toString(), 
      requestUser: req.user._id.toString() 
    });

    if (booking.driver.toString() !== req.user._id.toString()) {
      console.log('Unauthorized: Driver mismatch');
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Generate OTP for verification
    const otp = generateOTP();
    booking.status = 'arrived';
    booking.recall.arrivedAt = new Date();
    booking.verification.otp = otp;
    booking.verification.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await booking.save();

    // Notify customer
    const io = req.app.get('io');
    io.to(`customer-${booking.customer.phone}`).emit('car-arrived', {
      bookingId: booking.bookingId,
      otp
    });

    // Send Email with OTP (if email available)
    if (booking.customer.email) {
      await emailService.sendArrivalNotification(
        booking.customer.email,
        booking.customer.name,
        booking.bookingId,
        otp
      );
    }

    // Send SMS with OTP (backup or primary if no email)
    await smsService.sendArrivalNotification(
      booking.customer.phone,
      booking.bookingId,
      otp
    );

    res.json({ 
      message: 'Arrival confirmed. OTP sent to customer.',
      otp, // In production, don't send OTP in response
      booking 
    });
  } catch (error) {
    console.error('Mark arrived error:', error);
    res.status(500).json({ message: 'Failed to mark as arrived' });
  }
});

// Driver: Verify OTP and Complete
router.post('/:id/verify-complete', auth, authorize('driver'), 
  [
    body('otp').isLength({ min: 6, max: 6 }).withMessage('Invalid OTP'),
    body('paymentMethod').isIn(['cash', 'qr']).withMessage('Invalid payment method'),
    body('amount').isFloat({ min: 0 }).withMessage('Invalid amount')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { otp, paymentMethod, amount } = req.body;
      const booking = await Booking.findById(req.params.id);

      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      if (booking.driver.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      // Verify OTP
      if (booking.verification.otp !== otp) {
        return res.status(401).json({ message: 'Invalid OTP' });
      }

      if (new Date() > booking.verification.otpExpiry) {
        return res.status(401).json({ message: 'OTP expired' });
      }

      // Complete booking
      booking.status = 'completed';
      booking.verification.verified = true;
      booking.payment.method = paymentMethod;
      booking.payment.amount = parseFloat(amount);
      booking.payment.paidAt = new Date();
      booking.parking.actualEndTime = new Date();
      await booking.save();

      // Notify customer
      const io = req.app.get('io');
      io.to(`customer-${booking.customer.phone}`).emit('booking-completed', {
        bookingId: booking.bookingId
      });

      res.json({ 
        message: 'Booking completed successfully',
        booking 
      });
    } catch (error) {
      console.error('Complete booking error:', error);
      res.status(500).json({ message: 'Failed to complete booking' });
    }
  }
);

// Get Booking Statistics (Supervisor)
router.get('/stats/overview', auth, authorize('supervisor'), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await Booking.aggregate([
      {
        $facet: {
          today: [
            { $match: { createdAt: { $gte: today } } },
            { $count: 'count' }
          ],
          active: [
            { $match: { status: { $nin: ['completed', 'cancelled'] } } },
            { $count: 'count' }
          ],
          completed: [
            { $match: { status: 'completed' } },
            { $count: 'count' }
          ],
          revenue: [
            { $match: { status: 'completed', 'payment.amount': { $exists: true } } },
            { $group: { _id: null, total: { $sum: '$payment.amount' } } }
          ]
        }
      }
    ]);

    res.json({
      todayBookings: stats[0].today[0]?.count || 0,
      activeBookings: stats[0].active[0]?.count || 0,
      completedBookings: stats[0].completed[0]?.count || 0,
      totalRevenue: stats[0].revenue[0]?.total || 0
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
});

module.exports = router;
