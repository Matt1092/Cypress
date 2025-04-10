import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

// Create transporter for sending emails
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Register new user
export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Create new user
    user = new User({
      username,
      email,
      password
    });

    // Skip email verification for now
    user.isVerified = true; // Auto-verify users

    await user.save();

    // Skip email sending for now
    /*
    // Generate verification token
    const verificationToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    user.verificationToken = verificationToken;

    // Send verification email
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
    await transporter.sendMail({
      to: email,
      subject: 'Verify your email',
      html: `Please click <a href="${verificationUrl}">here</a> to verify your email.`
    });
    */

    res.status(201).json({ 
      success: true, 
      message: 'User registered successfully! You can now log in.' 
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Login user
export const loginUser = async (req, res) => {
  try {
    console.log('Login attempt received:', req.body.email);
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ success: false, message: 'Please provide both email and password' });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`Login failed: User not found with email ${email}`);
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if user is verified - temporarily disabled for testing
    /*
    if (!user.isVerified) {
      return res.status(400).json({ success: false, message: 'Please verify your email first' });
    }
    */

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log(`Login failed: Invalid password for user ${email}`);
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // JWT Secret check
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in environment variables');
      return res.status(500).json({ success: false, message: 'Internal server error with authentication' });
    }

    // Create and return JWT token with proper expiration
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' } // Extend token lifetime to 24 hours
    );

    console.log(`Login successful for user ${email}`);
    console.log(`Generated token: ${token.substring(0, 20)}...`);

    // Return success response with user data
    res.json({ 
      success: true, 
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error in loginUser controller:', error);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// Verify email
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid token' });
    }

    // Update user verification status
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Forgot password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send reset email
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    await transporter.sendMail({
      to: email,
      subject: 'Password Reset',
      html: `Please click <a href="${resetUrl}">here</a> to reset your password.`
    });

    res.json({ success: true, message: 'Password reset email sent' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Reset password
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.resetPasswordToken !== token || user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { username, email } = req.body;
    
    // Update fields
    if (username) user.username = username;
    if (email) user.email = email;
    
    await user.save();
    
    res.json({ 
      success: true, 
      data: {
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      } 
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
}; 