// src/index.js

// Wait for the DOM to fully load
function main() {
  displayPosts();
  addNewPostListener();
}

document.addEventListener('DOMContentLoaded', main);

// Display all blog posts in #post-list
function displayPosts() {
  fetch('http://localhost:3000/posts')
    .then(res => res.json())
    .then(posts => {
      const postList = document.getElementById('post-list');
      postList.innerHTML = '';
      posts.forEach(post => {
        const postItem = document.createElement('div');
        postItem.classList.add('post-item');
        postItem.innerHTML= `<h3>${post.title}</h3>
        <p>By ${post.author}</p>
        <p>${post.content.substring(0, 100)}...</p>`;
        postItem.dataset.id = post.id;
        postItem.addEventListener('click', () => handlePostClick(post.id));
        postList.appendChild(postItem);
      });

      // Advanced: Show first post by default
      if (posts.length > 0) {
        handlePostClick(posts[0].id);
      }
    });
}

// Show detailed info of one post in #post-detail
function handlePostClick(id) {
  fetch(`http://localhost:3000/posts/${id}`)
    .then(res => res.json())
    .then(post => {
      const detail = document.getElementById('post-detail');
      detail.innerHTML = `
        <h2>${post.title}</h2>
        <p>By ${post.author}</p>
         ${post.image ? `<img src="${post.image}" alt="${post.title}">` : ''}
        <p>${post.content}</p>
        <button id="edit-post">Edit</button>
        <button id="delete-post">Delete</button>
      `;
      
      document.getElementById('edit-post').addEventListener('click', () => showEditForm(post));
      document.getElementById('delete-post').addEventListener('click', () => deletePost(post.id));
    });
}

// Add a new post
function addNewPostListener() {
  const form = document.getElementById('new-post-form');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const title = form.title.value;
    const content = form.content.value;
    const author = form.author.value;
    const image =form.image.value;

    const newPost = { title, content, author };

    fetch('http://localhost:3000/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPost)
    })
      .then(res => res.json())
      .then(post => {
        displayPosts();
        form.reset();
      });
  });
}

// Show editable form for a post
function showEditForm(post) {
  const form = document.getElementById('edit-post-form');
  form.classList.remove('hidden');
  form["edit-title"].value = post.title;
  form["edit-content"].value = post.content;

  form.onsubmit = function (e) {
    e.preventDefault();
    const updatedPost = {
      title: form["edit-title"].value,
      content: form["edit-content"].value
    };
    fetch(`http://localhost:3000/posts/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedPost)
    })
      .then(res => res.json())
      .then(() => {
        form.classList.add('hidden');
        displayPosts();
      });
  };

  document.getElementById('cancel-edit').onclick = () => form.classList.add('hidden');
}

// Delete post
function deletePost(id) {
  fetch(`http://localhost:3000/posts/${id}`, {
    method: 'DELETE'
  }).then(() => {
    displayPosts();
    document.getElementById('post-detail').innerHTML = '<p>Select a post to see the details.</p>';
  });
}
