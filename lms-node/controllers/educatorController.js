import { clerkClient } from "@clerk/express";
import Course from "../models/Course.js";
import {v2 as cloudinary} from "cloudinary";

export const updateRoleToEducator = async (req, res) => {
    try {
        const userId = req.auth.userId

        await clerkClient.users.updateUserMetadata(userId, {
            publicMetadata:{
                role: 'educator',
            }
        })

        res.json({
            success: true,
            message: 'You can publish a course now'
        })
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
};


export const addCourse = async (req, res) => {
    try {
        const  {courseData}  = req.body
        const userId = req.auth.userId
        const imageFile = req.file 

        if (!imageFile) {
            return res.json({
                success: false,
                message: 'Course thumbnail is required'
            })
        }

        const parsedCourseData = await JSON.parse(courseData)
        parsedCourseData.educator = educatorId

        const newCourse = await Course.create(parsedCourseData)
       const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
            folder: 'course-thumbnails',
            public_id: newCourse._id,
            overwrite: true,
        })
         newCourse.courseThumbnail = imageUpload.secure_url
            await newCourse.save()
        res.json({
            success: true,
            message: 'Course created successfully',
        })
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}

// Get educator's courses
export const getEducatorCourses = async (req, res) => {
    try {
        const userId = req.auth.userId
        const courses = await Course.find({ educator: userId })

        res.json({
            success: true,
            courses
        })
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}