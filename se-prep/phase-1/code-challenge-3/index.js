// src/index.js
let currentlySelectedPost = null; // this will store whatever post the user clicked on
let allThePosts = []; // array to hold all our posts
let isStillLoading = false; // TODO: actually use this flag lol

// this function starts everything off when the page loads
function startEverything() {
    getAllPostsFromServer();
    makeNewPostFormWork();
}

// this function grabs all posts from our fake API and shows them on screen
// spent way too long debugging this async stuff...
async function getAllPostsFromServer() {
    try {
        // This fetchesfrom localhost because that's what the assignment says
        const serverResponse = await fetch('http://localhost:3000/posts');
        const allPosts = await serverResponse.json();
        allThePosts = allPosts; // store them globally because why not
        
        // find the div where all our posts will stay
        const postsContainer = document.getElementById('post-list'); // changed from var to const like a good programmer
        
        // wipe out whatever was there before
        postsContainer.innerHTML = '';
        
        // loop through each post and make it clickable
        // using old school for loop because forEach is confusing sometimes
        for(let i = 0; i < allPosts.length; i++) {
            const singlePost = allPosts[i];
            const postDiv = document.createElement('div');
            postDiv.className = 'blog-post';
            postDiv.innerHTML = `
                <div class="post-title">${singlePost.title}</div>
                <div class="post-author">by ${singlePost.author}</div>
            `;
            
            // make it so when you click on a post, it shows the details
            // this took me longer than it should have to figure out the first time
            postDiv.addEventListener('click', function(event) {
                showTheFullPost(singlePost.id, event);
            });
            
            postsContainer.appendChild(postDiv);
        }
        
        console.log('yay! loaded', allPosts.length, 'posts without breaking anything');
    } catch (error) {
        console.error('something went wrong loading posts:', error);
        document.getElementById('post-list').innerHTML = '<p style="color: red;">Oops! Failed to load posts. Make sure json-server is running!</p>';
    }
}

// show all the juicy details for whatever post the user clicked on
async function showTheFullPost(postId, event) {
    try {
        // grab the full post data from our server
        const serverResponse = await fetch(`http://localhost:3000/posts/${postId}`);
        const clickedPost = await serverResponse.json();
        currentlySelectedPost = clickedPost; // remember which one we're looking at
        
        // build out the HTML to show all the post info
        const detailsSection = document.getElementById('post-detail');
        detailsSection.innerHTML = `
            <h3>${clickedPost.title}</h3>
            <p><strong>Author:</strong> ${clickedPost.author}</p>
            <div style="margin-top: 15px;">
                <strong>Content:</strong>
                <p style="margin-top: 10px; line-height: 1.5;">${clickedPost.content}</p>
            </div>
            <div class="button-group">
                <button onclick="showEditForm()" class="btn btn-gray">Edit Post</button>
                <button onclick="deleteThisPost(${clickedPost.id})" class="btn btn-red">Delete Post</button>
            </div>
        `;
        
        // make the clicked post look selected in the list
        // (this part was a pain to get working right)
        document.querySelectorAll('.blog-post').forEach(postItem => {
            postItem.classList.remove('selected');
        });
        event.target.closest('.blog-post').classList.add('selected');
        
        // hide the edit form if it's showing
        document.getElementById('edit-post-form').classList.add('hide');
        
    } catch (error) {
        console.error('ugh, something broke when trying to show post details:', error);
    }
}

// make the new post form actually do something when you click submit
// this was surprisingly tricky for me to get right...
function makeNewPostFormWork() {
    const newPostForm = document.getElementById('new-post-form');
    
    newPostForm.addEventListener('submit', async function(e) {
        e.preventDefault(); // stop the page from refreshing like it normally would
        
        // grab whatever the user typed into the form fields
        const titleText = document.getElementById('post-title').value;
        const contentText = document.getElementById('post-content').value;
        const authorName = document.getElementById('post-author').value;
        
        // put it all together into a nice object
        const brandNewPost = {
            title: titleText,
            content: contentText,
            author: authorName
        };
        
        try {
            // send it over to the server
            const serverResponse = await fetch('http://localhost:3000/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json' // tell the server we're sending JSON
                },
                body: JSON.stringify(brandNewPost)
            });
            
            if (serverResponse.ok) {
                // wipe the form clean
                newPostForm.reset();
                
                // refresh everything to show the new post
                getAllPostsFromServer();
                
                alert('Woohoo! New post created successfully!');
            } else {
                alert('Hmm, something went wrong adding the post');
            }
        } catch (error) {
            console.error('oops, error adding new post:', error);
            alert('Couldn\'t add the post, maybe try again?');
        }
    });
}

// show the form where you can edit whatever post is currently selected
// this one gave me a headache to get working properly
function showEditForm() {
    if (!currentlySelectedPost) return; // give up if nothing is selected
    
    // pre-fill the form with whatever's already there
    document.getElementById('edit-title').value = currentlySelectedPost.title;
    document.getElementById('edit-content').value = currentlySelectedPost.content;
    
    // make the edit form visible
    document.getElementById('edit-post-form').classList.remove('hide');
    
    // make the form actually do something when submitted
    const editForm = document.getElementById('edit-post-form');
    editForm.onsubmit = async function(e) {
        e.preventDefault(); // don't refresh the page
        
        // create the updated post object with new values
        const updatedPostData = {
            ...currentlySelectedPost, // keep everything the same...
            title: document.getElementById('edit-title').value, // except update these
            content: document.getElementById('edit-content').value
        };
        
        try {
            // send the update to our server
            const serverResponse = await fetch(`http://localhost:3000/posts/${currentlySelectedPost.id}`, {
                method: 'PATCH', // PATCH because we're just updating some fields
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedPostData)
            });
            
            if (serverResponse.ok) {
                // hide the edit form
                editForm.classList.add('hide');
                
                // refresh everything so we can see the changes
                getAllPostsFromServer();
                // refresh the selected post details after edit
                setTimeout(() => {
                    const selectedPostElement = document.querySelector('.blog-post.selected');
                    if (selectedPostElement) {
                        selectedPostElement.click();
                    }
                }, 100);
                
                alert('Sweet! Post updated successfully!');
            }
        } catch (error) {
            console.error('dang it, error updating post:', error);
            alert('Ugh, failed to update post. Try again maybe?');
        }
    };
}

// let the user cancel out of editing mode
// probably should have made this a proper function but whatever
document.getElementById('cancel-edit-btn').addEventListener('click', function() {
    document.getElementById('edit-post-form').classList.add('hide');
});

// this function erases a post from existence
// added a confirmation dialog because accidentally deleting stuff sucks
async function deleteThisPost(postId) {
    if (!confirm('Are you REALLY sure you want to delete this post? This cannot be undone!')) {
        return; // user chickened out
    }
    
    try {
        // tell the server to delete this post
        const serverResponse = await fetch(`http://localhost:3000/posts/${postId}`, {
            method: 'DELETE' // bye bye post
        });
        
        if (serverResponse.ok) {
            // clear out the details area
            document.getElementById('post-detail').innerHTML = '<p style="color: #666; font-style: italic;">Click on a post to see details here...</p>';
            currentlySelectedPost = null; // nothing selected anymore
            
            // refresh the list so the deleted post disappears
            getAllPostsFromServer();
            
            alert('Post deleted successfully! (kinda sad but oh well)');
        } else {
            alert('Hmm, failed to delete post for some reason');
        }
    } catch (error) {
        console.error('something went wrong while trying to delete:', error);
        alert('Oops! Something went wrong while deleting');
    }
}

// kick off everything when the page finishes loading
// using DOMContentLoaded 
document.addEventListener('DOMContentLoaded', startEverything);