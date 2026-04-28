import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ProjectStoryProps {
  markdown: string;
}

const ProjectStory = ({ markdown }: ProjectStoryProps) => {
  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-display prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-img:rounded-lg">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  );
};

export default ProjectStory;
