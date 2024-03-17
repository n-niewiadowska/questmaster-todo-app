import Category from "./category";

type Quest = {
  title: string;
  dueTo: string;
  category: Category;
  description?: string;
}

export default Quest;