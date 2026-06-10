export interface ArticleFAQ {
    id: string;
    article_id?: string | null;
    media_id?: string | null;

    question_es: string;
    question_en?: string | null;
    answer_es: string;
    answer_en?: string | null;
    display_order: number;
}
