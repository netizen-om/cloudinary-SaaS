import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient()

export async function GET(){
    try {
        const video = await prisma.video.findMany({
            orderBy : {createdAt : "desc"}
        })

        return NextResponse.json(video)
    } catch (error : unknown) {
        return NextResponse.json(
            {error : error || "Error fetching videos"},
            {status : 500}
        )
    } finally {
        await prisma.$disconnect()
    }
}