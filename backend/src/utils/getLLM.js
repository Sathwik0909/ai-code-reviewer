import { ChatGroq } from "@langchain/groq";
import dotenv from "dotenv";

dotenv.config();
export const llm = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: "llama-3.3-70b-versatile",
    
  });