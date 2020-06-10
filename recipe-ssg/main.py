import os
from datetime import datetime
from jinja2 import Environment, PackageLoader
from markdown2 import markdown

## Parsing markdown files in our content
POSTS = {}
for markdown_post in os.listdir('content-content'):
    file_path = os.path.join('content-content', markdown_post)

    with open(file_path, 'r') as file:
        POSTS[markdown_post] = markdown(file.read(), extras=['metadata'])

POSTS = {
   post: POSTS[post] for post in sorted(POSTS, key=lambda post: datetime.strptime(POSTS[post].metadata['date'], '%Y-%m-%d'), reverse=True)
}

## Get the templates
env = Environment(loader=PackageLoader('main', 'templates'))
blogPost_template = env.get_template('blog-post-layout.html')
blogHome_template = env.get_template('blog-layout.html')

## Passing metadata to the homepage
posts_metadata = [POSTS[post].metadata for post in POSTS]
tags = [post['tags'] for post in posts_metadata]
blogHome_html = blogHome_template.render(posts=posts_metadata)

with open('blog.html', 'w') as file:
	file.write(home_html)

## Rendering individual posts
for post in POSTS:
    post_metadata = POSTS[post].metadata

    post_data = {
        'content': POSTS[post],
        'title': post_metadata['title'],
        'date': post_metadata['date'],
        'titleAbrv': post_metadata['date']
    }

    post_html = post_template.render(post=post_data)

    post_file_path = 'blog-output/{slug}.html'.format(slug=post_metadata['slug'])

    os.makedirs(os.path.dirname(post_file_path), exist_ok=True)
    with open(post_file_path, 'w') as file:
        file.write(post_html)