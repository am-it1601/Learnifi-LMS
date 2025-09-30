import { clerkClient } from "@clerk/express";
import User from "../models/User.js";
import Course from "../models/Course.js";
import Purchase from "../models/Purchase.js";
import Stripe from "stripe";
import CourseProgress from "../models/CourseProgress.js";

export const getUserData = async (req, res) => {
    try {
        const { userId } = req.auth();
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user
        });
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        });
    }
}

export const userEnrolledCourses = async (req, res) => {
    try {
        const { userId } = req.auth();
        const user = await User.findById(userId).populate('enrolledCourse');

        res.json({
            success: true,
            courses: user.enrolledCourse
        });
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        });
    }
}


export const purchaseCourse = async (req, res) => {
    try {
        const { courseId } = req.body;
        const { userId } = req.auth();
        const {origin} = req.headers;

        const userData = await User.findById(userId);
        const courseData = await Course.findById(courseId);
        console.log('courseData',courseData);
        
        if (!userData || !courseData) {
            return res.status(404).json({
                success: false,
                message: 'User or Course not found'
            });
        }

        // Check if user already enrolled in the course

        const price = Number(courseData.coursePrice) || 0;
const discount = Number(courseData.discountedPrice) || 0;

const finalAmount = price - (discount * price / 100);

        const purchaseData = {
            courseId: courseData._id,
            userId,
            amount: Number(finalAmount.toFixed(2)),// in cents
        }

        const  newPurchase = await Purchase.create(purchaseData);

        // stripe payment integration can be added here

        const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

        const currency = process.env.CURRENCY.toLowerCase() || 'USD';

        const line_items = [
            {
                price_data: {
                    currency: currency,
                    product_data: { 
                        name: courseData.courseTitle,
                    },
                    unit_amount: Math.floor(newPurchase.amount) * 100, // amount in cents
                },
                quantity: 1,
            },
        ];

        const session = await stripeInstance.checkout.sessions.create({
            mode: 'payment',
            success_url: `${origin}/loading/my-enrollments`,
            cancel_url: `${origin}/`,
            line_items: line_items,
            metadata: {
                purchaseId: newPurchase._id.toString(),
            },
        });

        // respond with success message and purchase details
        res.json({
            success: true,
            session_url: session.url,
        });
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        });
    }
}

// update user course progress
export const updateUserCourseProgress = async (req, res) => {
    try {
        const { courseId, lectureId } = req.body;
        const { userId } = req.auth();

        const progressData = await CourseProgress.findOne({ userId, courseId });
        if (progressData) {
            // If progress data exists, update it
            if (progressData.completedLectures.includes(lectureId)) {
               return res.json({
                success: true, message: 'Lecture already marked as completed',
               })
            }
            progressData.completedLectures.push(lectureId);
            await progressData.save();
        }else {
            await CourseProgress.create({ userId, courseId, lectureCompleted: [lectureId] });
        }

        res.json({
            success: true,
            message: 'Course progress updated successfully',
        });
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        });
    }
}

// get user course progress
export const getUserCourseProgress = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { userId } = req.auth();

        const progressData = await CourseProgress.findOne({ userId, courseId });

        res.json({
            success: true,
            progress: progressData 
        });
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        });
    }
}

// add user rating to course
export const addCourseRating = async (req, res) => {
    try {
        const { courseId, rating } = req.body;
        const { userId } = req.auth();

        if (!courseId || !userId || !rating ||rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Invalid input data'
            });
        }
        
        const courseData = await Course.findById(courseId);
        if (!courseData) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        
        // Check if user has already rated the course
        const user = await User.findById(userId);
        if (!user || !user.enrolledCourse.includes(courseId)) {
            return res.status(404).json({
                success: false,
                message: 'User has not purchased this course'
            });
        }
        const existingRatingIndex = courseData.courseRating.findIndex(r => r.userId.toString() === userId);
        if (existingRatingIndex > -1) {
            // Update existing rating
            courseData.courseRating[existingRatingIndex].rating = rating;
        } else {
            // Add new rating
            courseData.courseRating.push({ userId, rating });
        }
        await courseData.save();

        res.json({
            success: true,
            message: 'Course rating added/updated successfully',
        });
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        });
    }
}