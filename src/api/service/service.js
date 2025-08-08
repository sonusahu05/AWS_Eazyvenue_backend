const router = require("express").Router();
const Service = require("../../../model/Service");

// Add Services
 router.post("/add", async (req, res)=> {
    const service = new Service({
        service_title: req.body.service_title,
        service_meta_title: req.body.service_meta_title,
        service_meta_keyword: req.body.service_meta_keyword,
        service_short_description: req.body.service_short_description,
        service_long_description: req.body.service_long_description,
        service_image: req.body.service_image,
        status: req.body.status
    })
    try{
        const savedService = await service.save();
        res.send(savedService);
    } catch (error) {
        res.status(404).send(error);
    }
 });

 // Get All Service Listing
 router.get("/alllist", async (req, res)=> { 
    try {
    const services = await Service.find();  
    res.json(services);
    } catch (error) {
        res.json({ message: error});
    }
 });

// Get Single Service Listing
router.get("/listbyId/:Id", async (req, res)=> { 
    try {
    const service = await Service.findById(req.params.serviceId);  
    res.json(service);
    } catch (error) {
        res.json({ message: error});
    }
 });
 
// Update Service
router.put("/update/:Id", async (req, res)=> {
    try {
        const service = {
        service_title: req.body.service_title,
        service_meta_title: req.body.service_meta_title,
        service_meta_keyword: req.body.service_meta_keyword,
        service_short_description: req.body.service_short_description,
        service_long_description: req.body.service_long_description,
        service_image: req.body.service_image,
        status: req.body.status        
    };
    const updatedService = await Service.findByIdAndUpdate({_id:req.params.serviceId}, service);
        res.json(updatedService);
    } catch (error) {
        res.json({ message: error});
    }
 });

//Delet Service
router.delete("/delete/:Id", async (req, res)=> {
    try{
        const removeService = await Service.findByIdAndDelete(req.params.serviceId);
        res.json(removeService);
    } catch (error) {
        res.json({ message: error});
    }
});
module.exports = router;