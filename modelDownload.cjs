// "node -e \"const fs=require('fs'),crypto=require('crypto');const url='https://github.com/danielgatis/rembg/releases/download/v0.0.0/isnet-general-use.onnx';const out='public/models/isnet-general-use.onnx';fs.mkdirSync('public/models',{recursive:true});fetch(url).then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.arrayBuffer()}).then(b=>{const md5=crypto.createHash('md5').update(Buffer.from(b)).digest('hex');if(md5!=='fc16ebd8b0c10d971d3513d564d01e29')throw new Error('md5 mismatch: '+md5);fs.writeFileSync(out,Buffer.from(b));console.log('AI model saved:',out,b.byteLength,'bytes')}).catch(e=>{console.error(e);process.exit(1)})\"",
const fs = require("fs"),
	crypto = require("crypto");
const url = "https://github.com/danielgatis/rembg/releases/download/v0.0.0/isnet-general-use.onnx";
const out = "public/models/isnet-general-use.onnx";
fs.mkdirSync("public/models", { recursive: true });
fetch(url)
	.then(r => {
		if (!r.ok) throw new Error("HTTP " + r.status);
		return r.arrayBuffer();
	})
	.then(b => {
		const md5 = crypto.createHash("md5").update(Buffer.from(b)).digest("hex");
		if (md5 !== "fc16ebd8b0c10d971d3513d564d01e29") {
			throw new Error("md5 mismatch: " + md5);
		}
		fs.writeFileSync(out, Buffer.from(b));
		console.log("AI model saved:", out, b.byteLength, "bytes");
	})
	.catch(e => {
		console.error(e);
		process.exit(1);
	});
