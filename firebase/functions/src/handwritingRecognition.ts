import { onCall, HttpsError } from "firebase-functions/v2/https";
import { ImageAnnotatorClient } from "@google-cloud/vision";
import { getFirestore } from "firebase-admin/firestore";
interface Point { x:number; y:number; t:number }
type Stroke = Point[];
function renderSvg(strokes: Stroke[], width:number, height:number): string {
  const paths=strokes.filter(s=>s.length>1).map(s=>`<path d="M ${s.map((p,i)=>`${i?"L":""} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ")}"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="white"/><g fill="none" stroke="black" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">${paths}</g></svg>`;
}
function normalize(value:string):string{return value.toLocaleLowerCase("en").replace(/[^a-z0-9]/g,"");}
export const recognizeSellerHandwriting = onCall({ region:"asia-south1", timeoutSeconds:30, memory:"512MiB" }, async (request) => {
  const {strokes,width,height}=request.data as {strokes?:Stroke[];width?:number;height?:number};
  if(!Array.isArray(strokes)||strokes.length===0||typeof width!=="number"||typeof height!=="number")throw new HttpsError("invalid-argument","Handwriting strokes are required.");
  const svg=renderSvg(strokes,Math.min(1200,Math.max(300,width)),Math.min(800,Math.max(180,height)));
  const client=new ImageAnnotatorClient(); const [result]=await client.documentTextDetection({image:{content:Buffer.from(svg).toString("base64")}}); const recognizedText=(result.fullTextAnnotation?.text??"").trim().replace(/\s+/g," ");
  if(!recognizedText)return {recognizedText:"",matchedStudio:null};
  const snapshot=await getFirestore().collection("studios").where("active","==",true).where("approved","==",true).limit(100).get(); const target=normalize(recognizedText);
  const match=snapshot.docs.find(doc=>{const data=doc.data();return [data.name,data.slug].filter((v):v is string=>typeof v==="string").some(v=>normalize(v)===target);});
  if(!match)return {recognizedText,matchedStudio:null}; const data=match.data(); return {recognizedText,matchedStudio:{id:match.id,slug:String(data.slug),name:String(data.name),heroImageUrl:typeof data.bannerUrl==="string"?data.bannerUrl:null,storyFragment:typeof data.storyFragment==="string"?data.storyFragment:null}};
});
