import mongoose, { Schema, Document, Model } from 'mongoose';

interface IVerification extends Document {
    name: string;
    email: string;
    passwordHash: string; // Temporarily stores plain password until verification
    code: string;
    expiresAt: Date;
}

interface IVerificationModel extends Model<IVerification> {}

const verificationSchema = new Schema<IVerification>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true }, // Stores plain password temporarily (15 min max)
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true },
}, { timestamps: true });

const Verification = mongoose.model<IVerification, IVerificationModel>('Verification', verificationSchema);
export default Verification;


