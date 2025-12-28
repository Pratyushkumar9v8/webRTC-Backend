import {Request, Response, NextFunction} from "express";
import  httpStatus  from "http-status";
import  jwt  from "jsonwebtoken";

export const isAuthenticated = (req: Request, res: Response, next: NextFunction)=>{
    const token = req.cookies.token || null;
    if(!token){
        return res.status(httpStatus.UNAUTHORIZED).json({message:"Invalid Token"});
    }
    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
        (req as any).user = decoded;
        next();
    }
    catch (e) {
        return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid Token" });
    }
};