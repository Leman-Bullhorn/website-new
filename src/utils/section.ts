// the "id" MUST match the /section/<id>

/*
To add a new section:
copy this template, including the opening and closing braces:
{
  id: "<id>"
  display: "<display>"
  href: "/section/<id>"
  hidden: false
},

and paste it to the bottom of the list below (if this is confusing just paste this file into chatgpt and it can figure it out)
Then push the change to github (hopefully you're on the github website right now and using their built-in editor.
If so, you should be able to just press save on the change and it will go into effect)

- id is an internal identifier for the section, id recommend just keeping this short and simple, it is case-sensitive
- display is what is shown in the masthead and in the upper left corner of articles. Users will see this
- hidden controls whether a section is shown in the masthead as well as whether editors (not admins) can submit an article under that section
  The section does still exist and SHOULD NOT be deleted from the code unless you are 100% sure that *no* articles in the system have this section.
  To hide a section, change "false" to "true" (don't put the quotes)

DO NOT change the id or href for an existing section unless you are 100% sure that *no* articles in the system have this section and even then, you probably still shouldn't
*/

export const sections = [
  {
    id: "news",
    display: "News",
    href: "/section/news",
    hidden: false,
  },
  {
    id: "opinions",
    display: "Opinions",
    href: "/section/opinions",
    hidden: false,
  },
  {
    id: "features",
    display: "Features",
    href: "/section/features",
    hidden: false,
  },
  {
    id: "science",
    display: "Science",
    href: "/section/science",
    hidden: false,
  },
  {
    id: "sports",
    display: "Sports",
    href: "/section/sports",
    hidden: false,
  },
  {
    id: "arts",
    display: "Arts & Entertainment",
    href: "/section/arts",
    hidden: false,
  },
  {
    id: "humor",
    display: "Humor",
    href: "/section/humor",
    hidden: false,
  },
  {
    id: "podcasts",
    display: "Podcasts",
    href: "/section/podcasts",
    hidden: true,
  },
] satisfies {
  id: string;
  display: string;
  href: string;
  hidden: boolean;
}[];
