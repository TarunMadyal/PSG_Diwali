import http from "k6/http";
import { check,sleep } from "k6";
export const options={stages:[{duration:"20s",target:50},{duration:"40s",target:200},{duration:"60s",target:200},{duration:"20s",target:0}],thresholds:{http_req_failed:["rate<0.01"],http_req_duration:["p(95)<1200"]}};
const base=(__ENV.BASE_URL||"http://localhost:3000").replace(/\/$/,"");
const categories=["mens-night-pants","night-tshirts","half-collar","full-collar","womens-nightwear","kids-festive"];
export default function browseCatalog(){const home=http.get(`${base}/`);check(home,{"home 200":(r)=>r.status===200,"prompt shown":(r)=>r.body.includes("What would you like")});sleep(Math.random()*2+1);const slug=categories[Math.floor(Math.random()*categories.length)];const listing=http.get(`${base}/shop/${slug}`);check(listing,{"listing 200":(r)=>r.status===200});sleep(Math.random()*3+1);}
