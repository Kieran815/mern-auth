// MiddleWare
import mongoose, { Error } from "mongoose";
import express, { Request, Response } from "express";
import cors from "cors";
import passport from "passport";
import passportLocal from "passport-local";
import cookieParser from "cookie-parser";
import session from "express-session";
import bcrypt from "bcryptjs";
// security
import dotenv from "dotenv";
// module imports
import User from "./User"; // mongoose.Schema
import { UserInterface } from "./Interfaces/UserInterface"; // type interface

// **** Begin index.ts ****
console.log("MERN with TypeScript");

// create local strategy for passport middleware @ top of file
const LocalStrategy = passportLocal.Strategy;

// Connect to MongoDB using mongoose middleware
mongoose.connect(
  "mongodb+srv://Kieran:admin@cluster0.xgdcy.mongodb.net/mern-auth?retryWrites=true&w=majority",
  {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (err: Error) => {
    if (err) {
      throw err;
    } else {
      console.log("Connected to Database");
    }
  }
);

// **** MiddleWare ****
// Express.js
const app = express();
app.use(express.json()); // start app using Express
// CORS
app.use(cors({ origin: "http://localhost:3000", credentials: true })); // allow connection to front-end (react app)
// Express-Session
app.use(
  session({
    secret: "secretcode",
    resave: true,
    saveUninitialized: true,
  })
);
// Cookie-Parser
app.use(cookieParser());

// Passport & Passport-Session
app.use(passport.initialize()); // start auth checking
app.use(passport.session()); // run auth checks

passport.use(
  // setup local strategy parameters
  new LocalStrategy((username: string, password: string, done) => {
    // search db for matching user
    User.findOne({ username: username }, (err: Error, user: any) => {
      if (err) {
        throw err;
      }
      // if no user, return false
      if (!user) {
        return done(null, false);
      }
      // if user found, compare password values
      bcrypt.compare(password, user.password, (err: Error, result: boolean) => {
        if (err) throw err;
        if (result === true) {
          // return user login
          return done(null, user);
        } else {
          // if false, return false
          return done(null, false);
        }
      });
    });
  })
);

// Passport Serialize: interacts w/ browser cookies
passport.serializeUser((user: any, cb) => {
  cb(null, user._id);
});

passport.deserializeUser((id: string, cb) => {
  // get user info from db via `id`
  User.findOne({ _id: id }, (err: Error, user: any) => {
    const userInformation = {
      username: user.username,
      isAdmin: user.isAdmin,
    };
    cb(err, userInformation);
  });
});

// **** Routes ****;

// **************AUTHENTICATION**************

// **** CREATE NEW USER ****
// `req, res` are Typed, but can be left as inferred
app.post("/register", async (req: Request, res: Response) => {
  // add `?` for `undefined`
  // prevents errors:
  // `?`: if there are no requests, return `undefined`
  const { username, password } = req?.body;
  // extra type-validation (mongo was throwing an error)
  if (
    // no username, no password
    !username ||
    !password
  ) {
    res.send("Missing Input");
    return;
  } else if (
    // either are not strings
    typeof username !== "string" ||
    typeof password !== "string"
  ) {
    // send error message
    res.send("Improper Values");
    return;
  }
  // *** SEARCH FOR EXISTING USER:
  // assign an interface to type-check inputs
  // assign `UserInterface` to  `doc`
  User.findOne({ username }, async (err: Error, doc: UserInterface) => {
    if (err) throw err;
    if (doc) res.send("username already Taken");
    if (!doc) {
      const hashedPassword = await bcrypt.hash(password, 10);
      // de-structured: `req.body` includes `username` and `password`
      const newUser = new User({
        username,
        password: hashedPassword,
      });
      await newUser.save();
      res.send("New User Created");
    }
  });
});

// **** LOGIN ****
app.post(
  "/login",
  passport.authenticate("local"),
  (req: Request, res: Response) => {
    // If this function gets called, authentication was successful.
    // `req.user` contains the authenticated user.
    console.log("Logged In Successfully");
    console.log(req.user);
  }
);

// **** GET USER ****
app.get("/user", (req, res) => {
  // user stored in `express-session`, called up by `passport-js`
  res.send(req.user);
});

// activate server
app.listen(4000, () => {
  console.log("Serving Files: Listening on Port 4000");
});
