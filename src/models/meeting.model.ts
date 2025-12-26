import mongoose,{Schema, Model} from "mongoose";
import { timeStamp } from "node:console";

interface IMeeting{
    user_id:string,
    meetingCode:string,
    date:Date,
}

const meetingSchema=new Schema<IMeeting>(
    {
        user_id: {type:String,required:true},
        meetingCode:{type:String,required:true},
    },
    {
        timestamps:true
    }
)

const Meeting : Model<IMeeting>=mongoose.model<IMeeting>("Meeting",meetingSchema);

export {Meeting} ;
export type {IMeeting};