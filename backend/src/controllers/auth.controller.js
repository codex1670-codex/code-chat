import { sendWelcomeEmail } from "../emails/emailHandlers.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import {ENV} from "../lib/env.js"; 
import cloudinary from "../lib/cloudinary.js";

export const signup = async (req, res) => {
    const{fullName, email, password} = req.body;

    try{
        if(!fullName || !email || !password){
            return res.status(400).json({message:"All fields are requried"});
        }

        if(password.length < 6){
            return res.status(400).json({message:"Password must be 6 characters"});
        }

        //
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
           return res.status(400).json({message:"Invalid email formate"});
        }

         const user = await User.findOne({email});
         if (user) return res.status(400).json({message:"Email already exist"});

            //
            
            const salt = await bcrypt.genSalt(10)
            const hashedPassword = await bcrypt.hash(password,salt)

            const newUser = new User({
                fullName,
                email,
                password: hashedPassword,
            });

            if(newUser) {
                // before CR:
                 //generateToken(newUser._id, res);
                 //await newUser.save();

                 //after CR:
                 // 
            const savedUser = await newUser.save();
            generateToken(savedUser._id, res);

                res.status(201).json({
                    _id: newUser._id,
                    fullName: newUser.fullName,
                    email: newUser.email,
                profilePic: newUser.profilePic,  
});
        
                try{
                    await sendWelcomeEmail(savedUser.email, savedUser.fullName, ENV.CLIENT_URL);
                } catch(error){
                    console.error("Failed to send welcome email :", error);
                }
                
            } else {
                res.status(400).json({message:"Invalid user data"});
            }
        } catch (error) {
            console.log("Error in signup controller:", error);
            res.status(500).json({message: "Internal server error"});
        }
};

export const login = async (req, res) => {
    const {email, password} = req.body;

    if (!email || !password){
        return res.status(400).json({message:"Email and password are required"});
    }
    try{
        const user = await User.findOne({email});
        if (!user) return res.status(400).json({message:"Invalid credentials"});


        const isPasswordCorrect = await bcrypt.compare(password,user.password);
        if(!isPasswordCorrect) return res.status(400).json({message:"Invalid credentials"});

        const token = generateToken(user._id, res);

        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            profilePic: user.profilePic,
            token,
        });
    } catch (error){
        console.error("Error in login controller :", error)
        res.status(500).json({message:"Internal sever error"});
    }
};
export const logout = (_, res) => {
    res.cookie("jwt","",{maxAge:0})
    res.status(200).json({message:"logged out successfuly"})
};


export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    if (!profilePic) {
      return res.status(400).json({ message: "profile pic is required" });
    }

    console.log("Cloudinary config check:", {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? "SET" : "MISSING",
      api_key: process.env.CLOUDINARY_API_KEY ? "SET" : "MISSING",
      api_secret: process.env.CLOUDINARY_API_SECRET ? "SET" : "MISSING",
    });

    const uploadResponse = await cloudinary.uploader.upload(profilePic, {
      folder: "profile_pics",
      resource_type: "image",
    });

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { profilePic: uploadResponse.secure_url },
      { new: true }
    ).select("-password");

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("Error in update profile:", {
      message: error.message,
      http_code: error.http_code,
      name: error.name,
      full: error,
    });
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
      code: error.http_code,
    });
  }
};