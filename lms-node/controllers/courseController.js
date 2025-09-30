
import Course from "../models/Course.js";

export const getAllCourses = async (req, res) => {
    try {
        const courses = await Course.find({isPublished: true}).select(['-courseContent', '-enrolledStudents']).populate({ path: 'educator'});
        res.json({
            success: true,
            courses
        });
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        });
    }
};

export const getCourseById = async (req, res) => {
    const { id } = req.params;
    try {
        const course = await Course.findById(id).populate({ path: 'educator', select: 'fullName email' });

        // remove lectureUrl if isPreviewFree is false
        course.courseContent.forEach(lecture => {
            if (!lecture.isPreviewFree) {
                lecture.lectureUrl = ''
            }
        });
        res.json({
            success: true,
            course
        });
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        });
    }
}

