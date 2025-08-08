const router = require("express").Router();
const Wishlist = require("../../../model/Wishlist");
const cipher = require('../common/auth/cipherHelper');
const passport = require('passport');
const auth = passport.authenticate('jwt', { session: false });
const WishlistService = require('./wishlistService');
const wishlistService = new WishlistService();
const { ObjectId } = require('mongodb');
var moment = require('moment');
// Add All Venue Order
router.post("/", auth, async (req, res) => {
    const userId = cipher.getUserFromToken(req);

    const WishlistObj = new Wishlist({
        customerId: req.body.customerId,
        venueId: req.body.venueId,
        status: req.body.status,
        disable: req.body.disable,
        created_by: userId
    })
    try {
        // const savedWishlist = await WishlistObj.save();
        // res.send(savedWishlist);
        wishlistService.addWishlist(WishlistObj).then(Wishlist => {
            res.json({ message: "Data Inserted Successfully" });
        })
            .catch(err => res.status(400).send({ error: err.message }));
    } catch (error) {
        res.status(404).send(error);
    }
});

// Update Venue Order
router.put("/:id", auth, async (req, res) => {
    try {
        const userId = cipher.getUserFromToken(req);
        const WishlistObj = [];
        //console.log(req.body.comment);
        //return;
        const WishlistId = req.params.id;
        WishlistObj['updated_by'] = ObjectId(userId);
        WishlistObj['updated_at'] = moment.utc().toDate();
        for (var key in req.body) {
            if (key == "disable") {
                WishlistObj['disable'] = req.body.disable;
                WishlistObj['deleted_by'] = ObjectId(userId);
                WishlistObj['deleted_at'] = moment.utc().toDate();
            } else if (key == "status") {
                WishlistObj['status'] = req.body[key];
            } else {
                WishlistObj[key] = req.body[key];
            }
        }
        const updateData = Object.assign({}, WishlistObj);
        const updateWishlist = await wishlistService.updateWishlists(WishlistId, updateData).then(updateWishlistData => {
            res.json({ message: "Data Updated Successfully", data: updateWishlistData });
        });
    } catch (error) {
        res.json({ error: error });
    }

});

// Get All Venue Order Listing
router.get("/", auth, async (req, res) => {
    try {
        wishlistService
            .list(req.query)
            .then(Wishlist => {
                res.json({ totalCount: Wishlist.length, data: Wishlist });
            })
    } catch (error) {
        res.json({ message: error });
    }
});

// Get Single Venue Order Listing
router.get("/:id", auth, async (req, res) => {
    try {
        const Wishlists = await wishlistService.findById(req.params.id);
        res.json(Wishlists);
    } catch (error) {
        res.json({ message: error });
    }
});

//Delet Wishlist
router.delete("/:id", async (req, res) => {
    try {
        const removeWishlist = await wishlistService.findByIdAndDelete(req.params.id);
        res.json(removeWishlist);
    } catch (error) {
        res.json({ message: error });
    }
});

module.exports = router;