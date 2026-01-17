const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Book = require('../models/Book');
const { authenticate, isAdmin } = require('../middleware/auth');

// Create order
router.post('/', authenticate, async (req, res) => {
    try {
        const { deliveryAddress, paymentMethod } = req.body;

        if (!deliveryAddress || !paymentMethod) {
            return res.status(400).json({
                success: false,
                message: 'Delivery address and payment method are required'
            });
        }

        // Get user's cart
        const cart = await Cart.findOne({ user: req.user._id }).populate('items.book');
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cart is empty'
            });
        }

        // Validate payment method
        if (!['Cash On Delivery', 'Card'].includes(paymentMethod)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment method'
            });
        }

        // Check stock and prepare order items
        const orderItems = [];
        for (const cartItem of cart.items) {
            const book = cartItem.book;
            
            if (book.stock < cartItem.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${book.title}`
                });
            }

            orderItems.push({
                book: book._id,
                title: book.title,
                price: cartItem.price,
                quantity: cartItem.quantity,
                subtotal: cartItem.price * cartItem.quantity
            });
        }

        // Calculate totals
        const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
        const shippingFee = 20.00;
        const deliveryFee = 10.00;
        const total = subtotal + shippingFee + deliveryFee;

        // Create order
        const order = new Order({
            user: req.user._id,
            items: orderItems,
            deliveryAddress,
            paymentMethod,
            subtotal,
            shippingFee,
            deliveryFee,
            total
        });

        await order.save();

        // Update book stock
        for (const cartItem of cart.items) {
            await Book.findByIdAndUpdate(cartItem.book._id, {
                $inc: { stock: -cartItem.quantity }
            });
        }

        // Clear cart
        cart.items = [];
        await cart.save();

        await order.populate('user', 'name email');

        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating order',
            error: error.message
        });
    }
});

// Get user's orders
router.get('/my-orders', authenticate, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .populate('items.book')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching orders',
            error: error.message
        });
    }
});

// Get single order
router.get('/:id', authenticate, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('items.book');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if user owns the order or is admin
        if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.json({
            success: true,
            order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching order',
            error: error.message
        });
    }
});

// Update order status (admin only)
router.put('/:id/status', authenticate, isAdmin, async (req, res) => {
    try {
        const { status } = req.body;

        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).populate('items.book');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.json({
            success: true,
            message: 'Order status updated',
            order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating order status',
            error: error.message
        });
    }
});

// Get all orders (admin only)
router.get('/', authenticate, isAdmin, async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('user', 'name email')
            .populate('items.book')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching orders',
            error: error.message
        });
    }
});

module.exports = router;
