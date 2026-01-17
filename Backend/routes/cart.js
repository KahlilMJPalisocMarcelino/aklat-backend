const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Book = require('../models/Book');
const { authenticate } = require('../middleware/auth');

const MAX_QUANTITY = 50;

// Get user's cart
router.get('/', authenticate, async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user._id }).populate('items.book');

        if (!cart) {
            cart = new Cart({ user: req.user._id, items: [] });
            await cart.save();
        }

        res.json({
            success: true,
            cart
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching cart',
            error: error.message
        });
    }
});

// Add item to cart
router.post('/add', authenticate, async (req, res) => {
    try {
        const { bookId, quantity = 1 } = req.body;

        if (!bookId) {
            return res.status(400).json({
                success: false,
                message: 'Book ID is required'
            });
        }

        // Verify book exists
        const book = await Book.findById(bookId);
        if (!book || !book.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }

        // Check stock
        if (book.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient stock'
            });
        }

        // Check quantity limit
        if (quantity > MAX_QUANTITY) {
            return res.status(400).json({
                success: false,
                message: `Maximum quantity is ${MAX_QUANTITY} per item`
            });
        }

        // Find or create cart
        let cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            cart = new Cart({ user: req.user._id, items: [] });
        }

        // Check if item already exists in cart
        const existingItem = cart.items.find(
            item => item.book.toString() === bookId
        );

        if (existingItem) {
            const newQuantity = existingItem.quantity + quantity;
            
            if (newQuantity > MAX_QUANTITY) {
                return res.status(400).json({
                    success: false,
                    message: `Maximum quantity of ${MAX_QUANTITY} reached for this item`
                });
            }

            existingItem.quantity = newQuantity;
        } else {
            cart.items.push({
                book: bookId,
                quantity: quantity,
                price: book.price
            });
        }

        await cart.save();
        await cart.populate('items.book');

        res.json({
            success: true,
            message: 'Item added to cart',
            cart
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error adding item to cart',
            error: error.message
        });
    }
});

// Update cart item quantity
router.put('/update/:itemId', authenticate, async (req, res) => {
    try {
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be at least 1'
            });
        }

        if (quantity > MAX_QUANTITY) {
            return res.status(400).json({
                success: false,
                message: `Maximum quantity is ${MAX_QUANTITY} per item`
            });
        }

        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        const item = cart.items.id(req.params.itemId);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in cart'
            });
        }

        // Check stock
        const book = await Book.findById(item.book);
        if (book.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient stock'
            });
        }

        item.quantity = quantity;
        await cart.save();
        await cart.populate('items.book');

        res.json({
            success: true,
            message: 'Cart updated',
            cart
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating cart',
            error: error.message
        });
    }
});

// Remove item from cart
router.delete('/remove/:itemId', authenticate, async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        cart.items.pull(req.params.itemId);
        await cart.save();
        await cart.populate('items.book');

        res.json({
            success: true,
            message: 'Item removed from cart',
            cart
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error removing item from cart',
            error: error.message
        });
    }
});

// Clear cart
router.delete('/clear', authenticate, async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        cart.items = [];
        await cart.save();

        res.json({
            success: true,
            message: 'Cart cleared',
            cart
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error clearing cart',
            error: error.message
        });
    }
});

module.exports = router;
