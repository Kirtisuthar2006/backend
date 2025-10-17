import mongoose,{Schema}  from "mongoose";

const playListSchema = new Schema({
    content:{
        type:String,
        required:true,
    },
    owener:{
        type: Schema.Types.ObjectId,
        ref: "User",
    }
},{
    timestamps:true,
})

export const PlayList = mongoose.model("PlayList",playListSchema)