const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const axios = require('axios');
const cheerio = require('cheerio');

const db = require('./models');

const PORT = 3000;

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static('public'));

// set mongoose to use ES6 promises
mongoose.Promise = Promise;
//connect to mongo db
mongoose.connect('mongodb://localhost/nytScrape', {
  useMongoClient: true
});

// ----------------------------------------
// Routes
// app.get('/test', (req, res) => {
//   res.json({ message: 'horray! welcome to our api' });
// });

// app.post('/test', (req, res) => {
//   const article = new db.Article();
//   article.title = req.body.title;
//   article.URL = req.body.URL;

//   article.save(err => {
//     if (err) res.send(err);

//     res.json({ message: 'Article created!' });
//   });
// });

// GET route for scraping NYT website
app.get('/scrape', (req, res) => {
  // grab the body of the HTML request
  axios.get('https://www.nytimes.com/').then(response => {
    // load body into cheerio and save it to $ for shorthand selector
    const $ = cheerio.load(response.data);

    // grab every div with a class of collection and do the following:
    $('article h2').each((i, element) => {
      // save an empty result object
      const result = {};

      // add the text and href of every link and save them as properties on the result object
      result.title = $(element)
        .children('a')
        .text();
      result.URL = $(element)
        .children('a')
        .attr('href');

      // validate to make sure results have a value
      if (result.title && result.URL) {
        db.Article.create(result)
          .then(dbArticle => {
            res.send('scrape complete');
          })
          .catch(err => {
            res.json(err);
          });
      }
    });
  });
});

// Route for getting all articles from the db
app.get('/articles', (req, res) => {
  db.Article.find({})
    .then(dbArticle => {
      res.json(dbArticle);
    })
    .catch(err => {
      res.json(err);
    });
});

//Route for grabbing a specific Article by id and populate it with it's comments
app.get('/articles/:id', (req, res) => {
  db.Article.findOne({ _id: req.params.id })
    .populate('comment')
    .then(dbArticle => {
      res.json(dbArticle);
    })
    .catch(err => {
      res.json(err);
    });
});

//Route for saving/updating an Article's associated Comment
app.post('/articles/:id', (req, res) => {
  // Create a new comment and pass the req.body to the entry
  db.Comment.create(req.body)
    .then(dbComment => {
      // If a Comment was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Comment
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Article.findOneAndUpdate(
        { _id: req.params.id },
        { comment: dbComment._id },
        { new: true }
      );
    })
    .then(dbArticle => {
      //if we successfully update article send it back to client
      res.json(dbArticle);
    })
    .catch(err => {
      res.json(err);
    });
});

// Route to get all Comments
app.get('/comments', (req, res) => {
  db.Comment.find({})
    .then(dbComment => {
      res.json(dbComment);
    })
    .catch(err => {
      res.json(err);
    });
});
// ----------------------------------------
// Start the server
app.listen(PORT, function() {
  console.log('App running on port ' + PORT + '!');
});
