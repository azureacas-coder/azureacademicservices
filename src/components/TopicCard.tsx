import React from "react";
import { motion } from "motion/react";
import { TrendingUp, Hash, ArrowRight, Sparkles } from "lucide-react";
import { ResearchTopic } from "../services/geminiService";

interface TopicCardProps {
  topic: ResearchTopic;
  onSave?: (topic: ResearchTopic) => void;
  onGenerateAbstract?: (topic: ResearchTopic) => void;
}

export const TopicCard: React.FC<TopicCardProps> = ({ topic, onSave, onGenerateAbstract }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -5 }}
      className="group relative p-6 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2 px-3 py-1 bg-orange-50 text-brand-accent rounded-full text-xs font-semibold">
          <TrendingUp size={14} />
          {topic.trendingScore}% Momentum
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onGenerateAbstract?.(topic)}
            title="Generate PhD Abstract"
            className="p-2 hover:bg-orange-50 rounded-full text-gray-500 hover:text-brand-accent transition-colors"
          >
            <Sparkles size={18} />
          </button>
          <button
            onClick={() => onSave?.(topic)}
            title="Save to Registry"
            className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-brand-accent transition-colors"
          >
            <ArrowRight size={20} />
          </button>
        </div>
      </div>

      <h3 className="text-xl font-bold mb-3 tracking-tight group-hover:text-brand-accent transition-colors">
        {topic.title}
      </h3>
      
      <p className="text-gray-600 text-sm leading-relaxed mb-4 flex-grow">
        {topic.description}
      </p>

      <div className="pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">
          Contextual relevance
        </p>
        <p className="text-xs text-brand-primary/80 italic line-clamp-2 mb-4">
          "{topic.relevance}"
        </p>
        
        <div className="flex flex-wrap gap-2">
          {topic.tags.map(tag => (
            <span 
              key={tag}
              className="flex items-center gap-1 text-[10px] bg-gray-100 px-2 py-1 rounded-md text-gray-500 font-mono"
            >
              <Hash size={10} />
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
