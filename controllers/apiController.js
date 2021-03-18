const Item = require('../models/Item');
const Bank = require('../models/Bank');
const Booking = require('../models/Booking');
const Member = require('../models/Member');
const Category = require('../models/Category');
const Treasures = require('../models/Activity');
const Travellers = require('../models/Booking');
const { json } = require('express');
module.exports = {
  landingPage: async (req, res) => {
    try {
      const mostPicked = await Item.find()
        .select('_id title price country city price unit imageId')
        .limit(5)
        .populate({ path: 'imageId', select: ' id imageUrl' });

      const category = await Category.find()
        .select('_id name itemId')
        .limit(3)
        .populate({
          path: 'itemId',
          select: ' id title country city isPopular imageId',
          perDocumentLimit: 4,
          option: {
            sort: {
              sumBooking: -1,
            },
          },
          populate: {
            path: 'imageId',
            select: 'id imageUrl',
            perDocumentLimit: 1,
          },
        });

      const travellers = await Travellers.find();
      const treasures = await Treasures.find();
      const cities = await Item.find();
      for (let i = 0; i < category.length; i++) {
        for (let j = 0; j < category[i].itemId.length; j++) {
          const item = await Item.findOne({ _id: category[i].itemId[j]._id });
          item.isPopular = false;
          await item.save();
          if (category[i].itemId[0] === category[i].itemId[j]) {
            item.isPopular = true;
            await item.save();
          }
        }
      }

      const testimonial = {
        _id: 'asdsad',
        imageUrl: 'images/testimonial1.jpg',
        name: 'Happy Family',
        rate: 4.7,
        content:
          'what a great trip with my family and i should try again next time soon ...',
        familyName: 'Anggit',
        familyOccupation: 'Web Developer',
      };

      res.status(200).json({
        hero: {
          travellers: travellers.length,
          treasures: treasures.length,
          cities: cities.length,
        },
        mostPicked,
        category,
        testimonial,
      });
    } catch (error) {
      console.log(error);
    }
  },

  detailPage: async (req, res) => {
    try {
      const { id } = req.params;
      const bank = await Bank.find();
      const item = await Item.findOne({ _id: id })
        .populate({
          path: 'imageId',
          select: ' id imageUrl',
        })
        .populate({
          path: 'featureId',
          select: ' id name qty imageUrl',
        })
        .populate({
          path: 'activityId',
          select: ' id name type imageUrl',
        });
      const testimonial = {
        _id: 'asdsad',
        imageUrl: 'images/testimonial1.jpg',
        name: 'Happy Family',
        rate: 4.7,
        content:
          'what a great trip with my family and i should try again next time soon ...',
        familyName: 'Anggit',
        familyOccupation: 'Web Developer',
      };
      res.status(200).json({
        ...item._doc,
        bank,
        testimonial,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'internal server error' });
    }
  },

  bookingPage: async (req, res) => {
    try {
      const {
        idItem,
        duration,
        //price
        bookingStartDate,
        bookingEndDate,
        firstName,
        lastName,
        email,
        phoneNumber,
        accountHolder,
        bankFrom,
      } = req.body;

      if (!req.file) {
        return res.status(404).json({ message: ' image not found' });
      }

      if (
        idItem === undefined ||
        duration === undefined ||
        bookingStartDate === undefined ||
        bookingEndDate === undefined ||
        firstName === undefined ||
        lastName === undefined ||
        email === undefined ||
        phoneNumber === undefined ||
        accountHolder === undefined ||
        bankFrom === undefined
      ) {
        res.status(404).json({ message: 'Lengkapi semua field' });
      }

      const item = await Item.findOne({ _id: idItem });
      console.log(item);
      if (!item) {
        return res.status(404).json({ message: 'Item Not Found' });
      }

      item.sumBooking += 1;
      item.save();

      let total = item.price * duration;
      let tax = total + 0.1;

      const invoice = Math.floor(1000000 + Math.random() * 9000000);

      const member = await Member.create({
        firstName,
        lastName,
        email,
        phoneNumber,
      });
      const newBooking = {
        invoice,
        bookingStartDate,
        bookingEndDate,
        total: (total += tax),
        itemId: {
          _id: item.id,
          title: item.title,
          price: item.price,
          duration: duration,
        },
        memberId: member.id,
        payments: {
          proofPayment: `images/${req.file.filename}`,
          bankFrom: bankFrom,
          accountHolder: accountHolder,
        },
      };

      const booking = await Booking.create(newBooking);
      res.status(201).json({ message: 'success booking', booking });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ message: 'internal server error' });
    }
  },
};
