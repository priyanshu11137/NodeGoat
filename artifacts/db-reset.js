#!/usr/bin/env nodejs

"use strict";

// This script initializes the database. You can set the environment variable
// before running it (default: development). ie:
// NODE_ENV=production node artifacts/db-reset.js

const { MongoClient } = require("mongodb");
const bcrypt = require("bcrypt-nodejs");
const { db } = require("../config/config");

const finalEnv = (process.env.NODE_ENV || "development").toLowerCase();
const isLocalEnv = ["development", "test"].indexOf(finalEnv) !== -1;

// Set SEED_BCRYPT_PASSWORDS=true to seed one way bcrypt hashes instead of
// plaintext (use it together with the A2 - Broken Auth fix in
// app/data/user-dao.js, which is what compares the hash on login).
const useHashedPasswords = process.env.SEED_BCRYPT_PASSWORDS === "true";

// No credential material is stored in this file: every seeded password is read
// from the environment. Locally (development/test) it falls back to the demo
// value documented in README.md so `npm run db:seed` and the e2e suite keep
// working; any other environment must supply the variable explicitly.
const seedPassword = (envVar, localDefault) => {
    const fromEnv = process.env[envVar];

    if (!fromEnv && !isLocalEnv) {
        console.log(`ERROR: ${envVar} must be set to seed the "${finalEnv}" environment`);
        process.exit(1);
    }

    const password = fromEnv || localDefault;

    // Hashes are derived at run time; a precomputed hash must never be committed.
    return useHashedPasswords ? bcrypt.hashSync(password, bcrypt.genSaltSync()) : password;
};

const USERS_TO_INSERT = [
    {
        "_id": 1,
        "userName": "admin",
        "firstName": "Node Goat",
        "lastName": "Admin",
        "password": seedPassword("SEED_ADMIN_PASSWORD", "Admin_123"),
        "isAdmin": true
    }, {
        "_id": 2,
        "userName": "user1",
        "firstName": "John",
        "lastName": "Doe",
        "benefitStartDate": "2030-01-10",
        "password": seedPassword("SEED_USER1_PASSWORD", "User1_123")
    }, {
        "_id": 3,
        "userName": "user2",
        "firstName": "Will",
        "lastName": "Smith",
        "benefitStartDate": "2025-11-30",
        "password": seedPassword("SEED_USER2_PASSWORD", "User2_123")
    }];

const tryDropCollection = (db, name) => {
    return new Promise((resolve, reject) => {
        db.dropCollection(name, (err, data) => {
            if (!err) {
                console.log(`Dropped collection: ${name}`);
            }
            resolve(undefined);
        });
    });
};

// Seed passwords can come from the environment, so they are never logged.
const withoutPassword = (user) => ({ ...user, password: "[redacted]" });

const parseResponse = (err, res, comm) => {
    if (err) {
        console.log("ERROR:");
        console.log(comm);
        console.log(JSON.stringify(err));
        process.exit(1);
    }
    console.log(comm);
    console.log(JSON.stringify(res));
};


// Starting here
MongoClient.connect(db, (err, db) =>  {
    if (err) {
        console.log("ERROR: connect");
        console.log(JSON.stringify(err));
        process.exit(1);
    }
    console.log("Connected to the database");

    const collectionNames = [
        "users",
        "allocations",
        "contributions",
        "memos",
        "counters"
    ];

    // remove existing data (if any), we don't want to look for errors here
    console.log("Dropping existing collections");
    const dropPromises = collectionNames.map((name) => tryDropCollection(db, name));

    // Wait for all drops to finish (or fail) before continuing
    Promise.all(dropPromises).then(() => {
        const usersCol = db.collection("users");
        const allocationsCol = db.collection("allocations");
        const countersCol = db.collection("counters");

        // reset unique id counter
        countersCol.insert({
            _id: "userId",
            seq: 3
        }, (err, data) => {
            parseResponse(err, data, "countersCol.insert");
        });

        // insert admin and test users
        console.log("Users to insert:");
        USERS_TO_INSERT.forEach((user) => console.log(JSON.stringify(withoutPassword(user))));

        usersCol.insertMany(USERS_TO_INSERT, (err, data) => {
            const finalAllocations = [];

            // We can't continue if error here
            if (err) {
                console.log("ERROR: insertMany");
                console.log(JSON.stringify(err));
                process.exit(1);
            }
            parseResponse(err, {
                inserted: data.ops.length,
                users: data.ops.map(withoutPassword)
            }, "users.insertMany");

            data.ops.forEach((user) => {
                const stocks = Math.floor((Math.random() * 40) + 1);
                const funds = Math.floor((Math.random() * 40) + 1);

                finalAllocations.push({
                    userId: user._id,
                    stocks: stocks,
                    funds: funds,
                    bonds: 100 - (stocks + funds)
                });
            });

            console.log("Allocations to insert:");
            finalAllocations.forEach(allocation => console.log(JSON.stringify(allocation)));

            allocationsCol.insertMany(finalAllocations, (err, data) => {
                parseResponse(err, data, "allocations.insertMany");
                console.log("Database reset performed successfully");
                process.exit(0);
            });

        });
    });
});
