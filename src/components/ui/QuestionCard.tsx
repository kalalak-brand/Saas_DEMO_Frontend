/**
 * QuestionCard Component
 * Renders a question with rating or yes/no input options
 */
import React from 'react';
import clsx from 'clsx';
import { AdaptiveRating } from './AdaptiveRating';

export interface QuestionCardProps {
    question: { _id: string; text: string; questionType: string };
    answer: number | boolean | null | undefined;
    yesNoText?: string;
    onRatingChange?: (value: number) => void;
    onBooleanChange?: (value: boolean) => void;
    onTextChange?: (value: string) => void;
    ratingScale: 5 | 10;
    primaryColor: string;
    accentColor: string;
    disabled?: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
    question,
    answer,
    yesNoText,
    onRatingChange,
    onBooleanChange,
    onTextChange,
    ratingScale,
    primaryColor,
    accentColor,
    disabled = false,
}) => {
    const isRating = question.questionType === "rating";

    return (
        <div
            className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-3 border-l-4"
            style={{ borderColor: primaryColor }}
        >
            <h3 className="text-sm md:text-base font-medium text-gray-800 mb-4">
                {question.text}
            </h3>

            {isRating ? (
                <AdaptiveRating
                    value={typeof answer === "number" ? answer : null}
                    onChange={onRatingChange ?? (() => { })}
                    max={ratingScale}
                    accentColor={accentColor}
                    disabled={disabled}
                />
            ) : (
                <div className="space-y-3">
                    <div className="flex gap-3 justify-center">
                        <button
                            type="button"
                            onClick={() => !disabled && onBooleanChange?.(true)}
                            className={clsx(
                                "flex-1 max-w-[120px] py-3 rounded-lg font-medium transition-all",
                                answer === true
                                    ? "bg-green-500 text-white shadow-lg"
                                    : "bg-gray-100 text-gray-700 hover:bg-green-50",
                                disabled && "cursor-not-allowed opacity-50"
                            )}
                            disabled={disabled}
                        >
                            ✓ Yes
                        </button>
                        <button
                            type="button"
                            onClick={() => !disabled && onBooleanChange?.(false)}
                            className={clsx(
                                "flex-1 max-w-[120px] py-3 rounded-lg font-medium transition-all",
                                answer === false
                                    ? "bg-red-500 text-white shadow-lg"
                                    : "bg-gray-100 text-gray-700 hover:bg-red-50",
                                disabled && "cursor-not-allowed opacity-50"
                            )}
                            disabled={disabled}
                        >
                            ✗ No
                        </button>
                    </div>
                    {answer === true && onTextChange && (
                        <input
                            type="text"
                            value={yesNoText || ""}
                            onChange={(e) => onTextChange(e.target.value)}
                            placeholder="Please specify (optional)..."
                            className="w-full mt-2 p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                            disabled={disabled}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default QuestionCard;
