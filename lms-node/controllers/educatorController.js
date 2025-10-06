import { clerkClient, } from "@clerk/express";
import Course from "../models/Course.js";
import {v2 as cloudinary} from "cloudinary";
import Purchase from "../models/Purchase.js";
import User from "../models/User.js";

export const updateRoleToEducator = async (req, res) => {
    try {
        const {userId} = req.auth()
        console.log(userId);
        

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
        const imageFile = req.file 
        const {userId} = req.auth()        

        if (!imageFile) {
            return res.json({
                success: false,
                message: 'Course thumbnail is required'
            })
        }

        const parsedCourseData = await JSON.parse(courseData)
        parsedCourseData.educator = userId

        const newCourse = await Course.create(parsedCourseData)
       const imageUpload = await cloudinary.uploader.upload(imageFile.path)
         newCourse.courseThumbnail = imageUpload.secure_url
            await newCourse.save()
        res.json({
            success: true,
            message: 'Course Added',
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
        const {userId} = req.auth()
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

// get educator's dashboard data
export const getEducatorDashboardData = async (req, res) => {
    try {
        const {userId} = req.auth()
        const courses = await Course.find({ educator: userId })
        const totalCourses = courses.length;

        const courseIds = courses.map(course => course._id);

        // Calculate total earnings and total students
        const purchases = await Purchase.find({ courseId: { $in: courseIds }, status: 'completed' });
        
        const totalEarnings = purchases.reduce((total, purchase) => total + purchase.amount, 0).toFixed(2);

        const enrolledStudentsData = []
        for (const course of courses) {
            const students = await User.find({ _id: { $in: course.enrolledStudents } }).select('name imageUrl');
            students.forEach(student => {
                enrolledStudentsData.push({
                    courseTitle: course.courseTitle,
                 student
                });
            });
        }

        res.json({
            success: true,
            dashboardData: {
                totalCourses,
                totalEarnings,
                enrolledStudentsData
            }
        })
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}

// get all students enrolled in educator's courses
export const getEnrolledStudentsData = async (req, res) => {
    try {
        const {userId} = req.auth()
        const courses = await Course.find({ educator: userId })
        const courseIds = courses.map(course => course._id);

        const purchases = await Purchase.find({ courseId: { $in: courseIds }, status: 'completed' }).populate('userId', 'name email imageUrl').populate('courseId', 'courseTitle')  ;

        const enrolledStudents = purchases.map(purchase => ({
            student: purchase.userId,
            courseTitle: purchase.courseId.courseTitle,
            purchaseDate: purchase.createdAt,
        }));
        res.json({
            success: true,
            enrolledStudents
        })
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}
