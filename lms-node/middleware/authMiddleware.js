import e from "express"


export const protectEducator = async(req, res, next) => {
    try {
        const userId = req.auth.userId
        const response = await clerkClient.users.getUser(userId)

        if (response.publicMetadata.role !== 'educator') {
             return res.status(403).json({
                success: false,
                message: 'Access denied. Educator role required.'
            })
        }
        next()
    } catch (error) {
        res.status(401).json({
            success: false,
            message: error.message
        })
    }
}