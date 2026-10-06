// Return the locally generated brief as an attachment; no storage or logging.
module.exports = function handler(req,res) {
 res.setHeader('Cache-Control','no-store, private');
 res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).send('Use Save Plan PDF in the planner.');}
 const body=typeof req.body==='string'?Object.fromEntries(new URLSearchParams(req.body)):req.body||{};
 const encoded=typeof body.pdf==='string'?body.pdf:'';
 if(!encoded||encoded.length>4200000||!/^[A-Za-z0-9+/]*={0,2}$/.test(encoded))return res.status(400).send('Unable to download this PDF. Return to the planner and try again with fewer planning photos.');
 const pdf=Buffer.from(encoded,'base64');
 if(pdf.subarray(0,5).toString()!=='%PDF-')return res.status(400).send('Invalid PDF file.');
 const filename=String(body.filename||'Mountain_Objective_Plan_Brief.pdf').replace(/[^a-zA-Z0-9_.-]/g,'_').slice(0,180);
 res.setHeader('Content-Type','application/pdf');
 res.setHeader('Content-Disposition','attachment; filename="'+filename+'"');
 res.setHeader('Content-Length',pdf.length);
 return res.status(200).end(pdf);
};