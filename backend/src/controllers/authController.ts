import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const SECRET_KEY = process.env.JWT_SECRET || 'dev-only-fallback-key';

export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password, phone, address } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            phone,
            address
        });

        const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '1h' });

        res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Check user
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '1h' });

        res.status(200).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
};

export const googleLogin = async (req: Request, res: Response) => {
    try {
        const { token } = req.body;
        const { OAuth2Client } = require('google-auth-library');
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        if (!payload) {
            return res.status(400).json({ message: 'Invalid Google token' });
        }

        const { email, name, sub: googleId, picture } = payload;

        // Check if user exists
        let user = await User.findOne({ where: { email } });

        if (!user) {
            // Create new user
            user = await User.create({
                name: name || 'Google User',
                email: email,
                password: await bcrypt.hash(Math.random().toString(36).slice(-8), 10), // Random password
                role: 'client', // Default role
                // You might want to save googleId or pictureUrl if your model supports it
            });
        }

        // Generate JWT
        const jwtToken = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '1h' });

        res.status(200).json({ token: jwtToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        console.error('Google login error:', error);
        res.status(500).json({ message: 'Google login failed', error });
    }
};

// Verify token - called on app load to check if stored token is still valid
export const verifyToken = async (req: Request, res: Response) => {
    try {
        // If we reach here, the token is valid (middleware already verified it)
        // Return the user data from the token
        const user = (req as any).user;
        if (!user) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        // Fetch fresh user data from DB
        const dbUser = await User.findByPk(user.id, {
            attributes: ['id', 'name', 'email', 'role']
        });

        if (!dbUser) {
            return res.status(401).json({ message: 'User not found' });
        }

        res.status(200).json({ user: dbUser });
    } catch (error) {
        res.status(500).json({ message: 'Token verification failed', error });
    }
};
