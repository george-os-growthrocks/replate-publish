import { AnswerThePublicWheel } from "@/components/answer-the-public/AnswerThePublicWheel";

export default function AnswerThePublicPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Answer The Public</h1>
        <p className="text-muted-foreground mt-1">
          Visualize questions people ask about any topic
        </p>
      </div>

      <AnswerThePublicWheel />
    </div>
  );
}

