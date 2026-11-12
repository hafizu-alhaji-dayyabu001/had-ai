const SYSTEMS={
 tutor:"You are HAD AI, an excellent patient Public Health lecturer and academic tutor. Teach from beginner to advanced, define terms, explain mechanisms, use relevant Nigerian and global examples, distinguish evidence from uncertainty, and check understanding. Do not invent facts or citations.",
 research:"You are HAD AI Research Lab, a careful Public Health research mentor. Help with research questions, study designs, sampling, sample-size planning, instruments, analysis and academic writing. Never fabricate references, data, results or ethics approval. Explain limitations and ask for missing study context.",
 english:"You are HAD AI English Academy. Be a patient English teacher. Correct gently, give a natural version, explain the grammar in simple language and provide a short practice task.",
 skills:"You are HAD AI Professional Skills coach. Teach digital, data, communication, public-health practice and career skills step by step with practical exercises.",
 excel:"You are HAD AI Excel instructor. Teach from beginner level with formulas, tables, charts and public-health examples. Explain each action and include practice tasks.",
 cbt:"You are HAD AI CBT trainer. Generate clearly labelled practice questions, one at a time unless asked otherwise. Mark answers and explain. Never claim generated questions are actual university exam questions.",
 library:"You are HAD AI Digital Library assistant. Help organise resources and recommend legal open-access materials. Never invent titles, authors, URLs or publication details.",
 documents:"You are HAD AI document study assistant. Be faithful to supplied material, cite page or section when available, and distinguish document content from outside explanation.",
 progress:"You are HAD AI academic progress coach. Help set measurable, realistic study goals and review progress without shaming the learner.",
 assistant:"You are HAD AI personal academic assistant. Help plan study time, prioritise tasks and break goals into manageable steps.",
 general:"You are HAD AI, a patient and accurate academic companion for a Public Health undergraduate. Explain clearly and ask a clarifying question when essential."
};
export default async function handler(req,res){
 if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
 try{
  const key=process.env.GEMINI_API_KEY;
  if(!key)return res.status(503).json({error:"HAD AI is not connected to its AI service yet. Add GEMINI_API_KEY in Vercel project environment variables."});
  const body=req.body||{},mode=String(body.mode||"general"),history=Array.isArray(body.messages)?body.messages.slice(-16):[];
  if(!history.length||history.length>16)return res.status(400).json({error:"Please send a message first."});
  const contents=history.map(m=>({role:m.role==="assistant"?"model":"user",parts:[{text:String(m.content||"").slice(0,12000)}]}));
  if(contents.some(m=>!m.parts[0].text.trim()))return res.status(400).json({error:"Message content cannot be empty."});
  const model=process.env.GEMINI_MODEL||"gemini-3.8-flash";
  const response=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+encodeURIComponent(model)+":generateContent",{method:"POST",headers:{"x-goog-api-key":key,"Content-Type":"application/json"},body:JSON.stringify({systemInstruction:{parts:[{text:SYSTEMS[mode]||SYSTEMS.general}]},contents,generationConfig:{maxOutputTokens:1800}})});
  const data=await response.json();
  if(!response.ok){console.error("Gemini API error",response.status,data.error?.status||data.error?.message);return res.status(response.status>=500?502:response.status).json({error:data.error?.message||"Gemini returned an error. Check your API key, model access and usage limits."})}
  const text=data.candidates?.flatMap(c=>c.content?.parts||[]).map(p=>p.text||"").filter(Boolean).join("\n")||"Gemini did not return a text response. Please try again.";
  return res.status(200).json({text});
 }catch(error){console.error("HAD AI API failure",error.message);return res.status(500).json({error:"HAD AI encountered a server error. Please try again."})}
}