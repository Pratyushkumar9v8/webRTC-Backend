import mongoose, { Schema, Model } from "mongoose";

interface IUser {
    name: string;
    username: string;
    password: string;
    token?: string;
}

const userSchema = new Schema<IUser>(
    {
        name: { type: String, required: true },
        username: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        token: { type: String },
    },
    {
        timestamps: true,
    }
)

const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);

export { User };
export type {IUser};