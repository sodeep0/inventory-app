import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user';
import Verification from '../utils/verification';
import { sendEmail } from '../utils/email';
const router = Router();

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username,email, password } = req.body;
    
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }
    // Validate username
    if (!username || typeof username !== 'string') {
      res.status(400).json({ message: 'Username is required' });
      return;
    }
    //validate email
    if (!email || typeof email !== 'string') {
      res.status(400).json({ message: 'Email is required' });
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      res.status(400).json({ message: 'Invalid email' });
      return;
    }
    
    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
      res.status(400).json({ message: 'Username must be 3-30 characters' });
      return;
    }
    

    // Validate password
    if (!password || typeof password !== 'string') {
      res.status(400).json({ message: 'Password is required' });
      return;
    }
    
    if (password.length < 8) {
      res.status(400).json({ message: 'Password must be at least 8 characters' });
      return;
    }
    
    await Verification.deleteOne({ email });

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    
    // Store plain password - User model will hash it when creating the user
    await Verification.create({ 
      name: trimmedUsername, 
      email, 
      passwordHash: password, // Store plain password temporarily
      code: verificationCode, 
      expiresAt 
    });
    
    try {
      await sendEmail({ to_email: email, verification_code: verificationCode });
    } catch (error) {
      console.error('Error sending email:', error);
    }
    
    res.status(200).json({ message: 'Verification code sent to your email' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

router.post('/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }
    const pending = await Verification.findOne({ email });
        if (!pending) {
          res.status(404).json({ message: 'No verification pending for this email. Please register again.' }); 
          return;
        }
        
        if (new Date() > pending.expiresAt) {
            await Verification.deleteOne({ email });
             res.status(400).json({ message: 'Verification code has expired. Please register again.' });
             return;
            }
        
        if (pending.code !== code) {
             res.status(400).json({ message: 'Invalid verification code.' });
             return;
            }
            
            // Create user - User model will hash the password via pre-save hook
            const user = await User.create({
              email: pending.email,
              username: pending.name,
              password: pending.passwordHash // This is plain password, will be hashed by pre-save hook
            });
            
            await Verification.deleteOne({ email });
            
            // Generate token for auto-login
            const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET as string, {
              expiresIn: '7d',
            });
            
            // Single response with message, token, and user info
            res.status(201).json({ 
              message: 'User registered successfully', 
              token,
              username: user.username,
              email: user.email
            });
            return;
  }catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ message: 'Verification failed' });
  }
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }
    
    // Case-insensitive email lookup
    const user = await User.findOne({  email });
    
    if (!user) {
      const pending = await Verification.findOne({ email });
            if (pending) {
                // regenerate code and expiry
                const newCode=Math.floor(100000 + Math.random() * 900000).toString();
                pending.code = newCode;
                pending.expiresAt = new Date(Date.now() + 15 * 60 * 1000);
                await pending.save();
                try {
                    await sendEmail({ to_email: email, verification_code: newCode });
                } catch (e) {
                    console.error('Failed to send verification email on login:', e);
                }
                 res.status(409).json({ message: 'Email not verified. Verification code resent.', requireVerification: true });
                 return;
            }
             res.status(404).json({ message: "You don't have an account" });
             return;
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET as string, {
      expiresIn: '7d', // 7 days instead of 1 hour
    });
    
    res.json({ 
      token,
      username: user.username,
      email: user.email
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
        if (!user) {
             res.status(404).json({ message: "You don't have an account" });
             return;
        }

        const code=Math.floor(100000 + Math.random() * 900000).toString();
        user.verificationCode = code;
        user.verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
        await user.save();

        try {
            await sendEmail({ to_email: user.email, verification_code: code });
        } catch (e) {
            console.error('Failed to send reset email:', e);
        }

         res.json({ message: 'Password reset code sent to your email.' });
         return;
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Reset password failed' });
  }
});
router.post('/verify-reset-code', async (req: Request, res: Response): Promise<void> => {
  const { email, code } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user)  {
          res.status(404).json({ message: "You don't have an account" }); 
          return;
        }
        if (!user.verificationCode || !user.verificationCodeExpires) {
             res.status(400).json({ message: 'No reset code found. Please request a new one.' });
             return;
            }
        if (new Date() > user.verificationCodeExpires) {
            user.verificationCode = "";
            user.verificationCodeExpires = new Date();
            await user.save();
             res.status(400).json({ message: 'Reset code expired. Please request a new one.' });
             return;
            }
        if (user.verificationCode !== code) {
             res.status(400).json({ message: 'Invalid reset code.' });
             return;
            }
        // Mark as verified for reset by clearing code but setting a short-lived flag via token-like approach
        // For simplicity, respond success; frontend will proceed to reset page with email in state.
         res.json({ message: 'Code verified. You may reset your password now.' });
         return;
    
        } catch (error) {
        console.error('Verify Reset Code Error:', error);
         res.status(500).json({ message: 'Server error' });
         return;
    }});

router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  const { email, code, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ message: "You don't have an account" });
      return;
    }
    if (!user.verificationCode || !user.verificationCodeExpires) {
      res.status(400).json({ message: 'No reset code found. Please request a new one.' });
      return;
    }
    if (new Date() > user.verificationCodeExpires) {
      user.verificationCode = "";
      user.verificationCodeExpires = new Date();
      await user.save();
      res.status(400).json({ message: 'Reset code expired. Please request a new one.' });
      return;
    }
    if (user.verificationCode !== code) {
      res.status(400).json({ message: 'Invalid reset code.' });
      return;
    }

    user.password = newPassword; // pre-save will hash
    user.verificationCode = "";
    user.verificationCodeExpires = new Date();
    await user.save();

    res.json({ message: 'Password reset successful. You may now log in.' });
    return;
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ message: 'Server error' });
    return;
  }
});
export default router;

