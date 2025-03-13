import { v2 as cloudinary } from 'cloudinary';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server"
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient()
// Configuration
cloudinary.config({ 
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME , 
    api_key: process.env.CLOUDINARY_API_KEY , 
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});

interface CloudinaryUploadResult {
    public_id : string;
    bytes : number;
    duration?: number 
    [key : string] : unknown
}


export const config = {
    runtime: "nodejs",
};

export async function POST(request : NextRequest){

    
    let userId;
    try {
        const { userId: authUserId } = await auth();
        userId = authUserId;
    } catch (error) {
        console.error("Auth error:", error);
        return NextResponse.json(
            { error: "Authentication failed" },
            { status: 500 }
        );
    }
    
    if(!userId){
        return NextResponse.json(
            { error : "Unauthorized" },
            { status : 401 }
        )
    }
    
    try {
        //covering edge caseing
        if(
            !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
            !process.env.CLOUDINARY_API_KEY ||
            !process.env.CLOUDINARY_API_SECRET
        ) {
            return NextResponse.json(
                { error : "Cloudinary credentials not found" },
                { status : 500 }
            )
        }

        const formData = await request.formData()
        const file = formData.get("file") as File | null
        const title = formData.get("title") as string
        const description = formData.get("description") as string
        const originalSize = formData.get("originalSize") as string   

        if(!file){
            return NextResponse.json(
                { error : "No file uploaded" },
                { status : 400 }
            )
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const result = await new Promise<CloudinaryUploadResult>(
            (resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { 
                        resource_type : "video",
                        transformation : [
                            { quality : "auto", fetch_format : "mp4" }
                        ],
                        folder : "SaaS-video-uploads",
                    },
                    (error, result) => {
                        if(error) reject(error);
                        else resolve(result as CloudinaryUploadResult)
                    }
                )
                uploadStream.end(buffer)
            }
        )

        const video = await prisma.video.create({
            data : {
                title,
                description,
                originalSize,
                compressedSize : String(result.bytes),
                publicId : result.public_id,
                duration : result.duration || 0
            }
        })

        return NextResponse.json(video, { status : 200})

    } catch (error : unknown) {
        console.log("Upload video failed" + error);
        return NextResponse.json(
            { error : "Upload video failed"},
            { status : 500 }
        )
    }  finally {
        await prisma.$disconnect()
    }

}
