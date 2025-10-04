import { GoogleGenAI } from "@google/genai";
import type { SearchResult, Album } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("Gemini API key not found. Please set the API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const getMusicFunFact = async (item: SearchResult): Promise<string> => {
  if (!API_KEY) {
    return "Gemini API key is not configured. Cannot fetch fun fact.";
  }

  try {
    const prompt = item.type === 'album'
      ? `Tell me one interesting, concise fun fact about the album "${item.title}" by ${item.artist}. Keep it to 1-2 sentences.`
      : `Tell me one interesting, concise fun fact about the song "${item.title}" by ${item.artist} from the album "${item.albumTitle}". Keep it to 1-2 sentences.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7
      }
    });

    return response.text.trim();
  } catch (error) {
    console.error("Error fetching fun fact from Gemini API:", error);
    return "Could not fetch a fun fact at this time.";
  }
};

export const getAlbumOverview = async (album: Album): Promise<string> => {
  if (!API_KEY) {
    return "Gemini API key is not configured. Cannot fetch overview.";
  }

  try {
    const prompt = `Give me a brief, one-paragraph overview of the album "${album.title}" by ${album.artist}. Touch on its genre, mood, or significance.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.6
      }
    });

    return response.text.trim();
  } catch (error) {
    console.error("Error fetching album overview from Gemini API:", error);
    return "Could not fetch an AI-powered overview at this time.";
  }
};