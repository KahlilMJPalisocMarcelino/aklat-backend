const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const { optionalAuth, authenticate, isAdmin } = require('../middleware/auth');

// Get all books (public)
router.get('/', optionalAuth, async (req, res) => {
    try {
        const { category, staffPick, search } = req.query;
        const query = { isActive: true };

        if (category && category !== 'all') {
            query.category = category;
        }

        if (staffPick === 'true') {
            query.staffPick = true;
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { author: { $regex: search, $options: 'i' } }
            ];
        }

        const books = await Book.find(query).sort({ createdAt: -1 });

        res.json({
            success: true,
            count: books.length,
            books
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching books',
            error: error.message
        });
    }
});

// Get single book
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);

        if (!book || !book.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }

        res.json({
            success: true,
            book
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching book',
            error: error.message
        });
    }
});

// Create book (admin only)
router.post('/', authenticate, isAdmin, async (req, res) => {
    try {
        const book = new Book(req.body);
        await book.save();

        res.status(201).json({
            success: true,
            message: 'Book created successfully',
            book
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating book',
            error: error.message
        });
    }
});

// Update book (admin only)
router.put('/:id', authenticate, isAdmin, async (req, res) => {
    try {
        const book = await Book.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }

        res.json({
            success: true,
            message: 'Book updated successfully',
            book
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating book',
            error: error.message
        });
    }
});

// Delete book (admin only)
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
    try {
        const book = await Book.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );

        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }

        res.json({
            success: true,
            message: 'Book deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting book',
            error: error.message
        });
    }
});

module.exports = router;
