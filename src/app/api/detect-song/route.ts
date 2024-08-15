import { NextRequest, NextResponse } from 'next/server';
import { Song } from "@/stores/playlist-store";
import fetch from 'node-fetch';
import FormData from 'form-data';

export async function POST(request: NextRequest): Promise<NextResponse> {
  console.log("API endpoint called");
  const apiToken = process.env.AUDD_API_TOKEN;
  if (!apiToken) {
    console.error("AUDD_API_TOKEN is not set in the environment variables");
    return NextResponse.json({ error: "AUDD_API_TOKEN is not set in the environment variables" }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    if (!audioFile) {
      console.error("Audio file is missing in the request");
      return NextResponse.json({ error: "audio file is required" }, { status: 400 });
    }

    console.log("Audio file received:", audioFile.name, "Size:", audioFile.size, "bytes");

    // Read the audio file as an ArrayBuffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create a new FormData instance for the AudD API request
    const auddFormData = new FormData();
    auddFormData.append('api_token', apiToken);
    auddFormData.append('file', buffer, { filename: 'audio.mp3' });
    auddFormData.append('return', 'apple_music,spotify');

    console.log("Sending request to AudD API...");

    const response = await fetch("https://api.audd.io/", {
      method: "POST",
      body: auddFormData,
    });

    console.log("Response status:", response.status);

    const data = await response.json();
    console.log("API response:", JSON.stringify(data, null, 2));

    if (data.status === 'success') {
      if (data.result) {
        const song: Song = {
          title: data.result.title,
          artist: data.result.artist,
          duration: "0:00", // AudD doesn't provide duration, so we'll keep it as is
        };
        return NextResponse.json(song);
      } else {
        console.log("No track detected in API response");
        return NextResponse.json({ error: "No track detected" }, { status: 404 });
      }
    } else {
      console.error("AudD API error:", data.error?.error_message || "Unknown error");
      return NextResponse.json({ error: data.error?.error_message || "Unknown error from AudD API" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error detecting song:", error);
    return NextResponse.json({ error: "An error occurred while detecting the song" }, { status: 500 });
  }
}