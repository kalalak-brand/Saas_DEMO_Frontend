import { LayoutList, CheckSquare, LogOut } from "lucide-react";
import clsx from "clsx";
// ❌ REMOVED: No longer need useCompositeStore
// import { useCompositeStore } from "../../stores/compositeStore"; 
import { useManagementStore } from "../../stores/managementStore";
import { useFilterStore } from "../../stores/filterStore";
import { useActiveCategories } from "../../stores/categoryStore";
import { useMemo } from "react";
import { AnalyticsItemType } from "../../stores/analyticsStore";

interface SidebarProps {
    isSidebarOpen: boolean;
    isMobile: boolean;
    toggleSidebar: () => void;
    sidebarMode: AnalyticsItemType;
    setSidebarMode: (mode: AnalyticsItemType) => void;
    onSelectItem: (id: string, name: string, type: AnalyticsItemType) => void;
    currentItemId: string | undefined | null;
    onLogout: () => void; // ✅ ADDED Logout handler prop
}
//span
export const Sidebar = ({
    isSidebarOpen,
    isMobile,
    toggleSidebar,
    sidebarMode,
    setSidebarMode,
    onSelectItem,
    currentItemId,
    onLogout, // ✅ ADDED
}: SidebarProps) => {
    const { category } = useFilterStore(); // This is the slug like "room"
    const activeCategories = useActiveCategories();

    // ✅ CHANGED: Read all data from useManagementStore
    const {
        composites,
        isLoading: isLoadingComposites,
        questions,
        isLoading: isLoadingQuestions
    } = useManagementStore();

    // Look up the category _id from the slug
    const categoryId = useMemo(() => {
        const cat = activeCategories.find(c => c.slug === category);
        return cat?._id;
    }, [activeCategories, category]);

    // Filtered lists based on category _id (not slug)
    const filteredComposites = useMemo(() => {
        if (!categoryId) return [];
        return (composites || []).filter(c => c && c.category === categoryId && c.isActive);
    }, [composites, categoryId]);

    const filteredQuestions = useMemo(() => {
        if (!categoryId) return [];
        return (questions || []).filter(q => q && q.category === categoryId);
    }, [questions, categoryId]);

    // Sidebar container classes
    const sidebarClasses = clsx(
        "bg-primary text-white transition-transform duration-300 ease-in-out",
        "flex flex-col",
        "overflow-hidden",
        {
            "fixed inset-y-0 left-0 h-full w-64 z-50 shadow-lg": isMobile,
            "translate-x-0": isMobile && isSidebarOpen,
            "-translate-x-full": isMobile && !isSidebarOpen,
            "relative w-64 flex-shrink-0 md:h-[calc(93vh-80px)] md:rounded-[20px] md:ml-2 md:mb-2 md:shadow-md": !isMobile,
            "hidden md:flex": !isMobile,
        }
    );

    // Item rendering function (uses button for better accessibility)
    const renderItem = (item: { id: string, name: string, type: AnalyticsItemType }, index: number) => {
        const isActive = item.id === currentItemId;
        return (
            <button
                key={`${item.type}-${item.id}-${index}`}
                onClick={() => onSelectItem(item.id, item.name, item.type)}
                className={clsx(
                    "flex items-center w-[calc(100%-1rem)] px-2 py-2 mx-auto mt-1 rounded-lg hover:bg-secondary hover:text-white transition-colors duration-200 text-pink-100 text-left",
                    { "bg-secondary text-white font-semibold": isActive }
                )}
                title={item.name}
            >
                {item.type === 'composite' ? <LayoutList className="h-5 w-5 mr-3 flex-shrink-0" /> : <CheckSquare className="h-5 w-5 mr-3 flex-shrink-0" />}
                <span className={clsx("truncate ml-1", { "": !isSidebarOpen && !isMobile })}>
                    {item.name}
                </span>
            </button>
        );
    };

    return (
        <>
            {/* Overlay for mobile */}
            {isMobile && isSidebarOpen && (
                <div className="fixed inset-0 bg-black opacity-50 z-40 md:hidden" onClick={toggleSidebar}></div>
            )}

            {/* Sidebar element */}
            <aside className={sidebarClasses}>
                {/* --- Sidebar Tabs --- */}
                <div className="flex p-2 border-b border-secondary flex-shrink-0">
                    <button
                        onClick={() => setSidebarMode('composite')}
                        className={`flex-1 py-2 px-1 text-center font-medium rounded-l-md transition-colors ${sidebarMode === 'composite' ? 'bg-secondary text-white' : 'text-pink-100 hover:bg-secondary/70'
                            }`}
                    >
                        Comp
                    </button>
                    <button
                        onClick={() => setSidebarMode('question')}
                        className={`flex-1 py-2 px-1 text-center font-medium rounded-r-md transition-colors ${sidebarMode === 'question' ? 'bg-secondary text-white' : 'text-pink-100 hover:bg-secondary/70'
                            }`}
                    >
                        Ques
                    </button>
                </div>

                {/* --- Conditional List --- */}
                {/* flex-1 allows nav to fill remaining space, overflow-y-auto handles scrolling */}
                <nav className="flex-1 py-2 overflow-y-auto">
                    {sidebarMode === 'composite' && (
                        <>
                            {isLoadingComposites && <p className="text-center text-pink-100 py-4 animate-pulse">Loading...</p>}
                            {!isLoadingComposites && filteredComposites.length === 0 && (
                                <p className="px-4 py-2 text-pink-100 text-sm text-center">No {category.toUpperCase()} composites found.</p>
                            )}
                            {filteredComposites.map((item, index) => renderItem({ id: item._id, name: item.name, type: 'composite' }, index))}
                        </>
                    )}
                    {sidebarMode === 'question' && (
                        <>
                            {isLoadingQuestions && <p className="text-center text-pink-100 py-4 animate-pulse">Loading Questions...</p>}
                            {!isLoadingQuestions && filteredQuestions.length === 0 && (
                                <p className="px-4 py-2 text-pink-100 text-sm text-center">No {category.toUpperCase()} questions found.</p>
                            )}
                            {filteredQuestions.map((item, index) => renderItem({ id: item._id, name: item.text, type: 'question' }, index))}
                        </>
                    )}
                </nav>

                {/* ✅ ADDED: Logout Button Section */}
                {/* This div is outside the <nav>, so it won't scroll */}
                {/* flex-shrink-0 prevents it from shrinking */}
                <div className="p-2 border-t border-secondary flex-shrink-0">
                    <button
                        onClick={onLogout}
                        className={clsx(
                            "flex items-center w-[calc(100%-1rem)] px-2 py-2 mx-auto mt-1 rounded-lg hover:bg-secondary hover:text-white transition-colors duration-200 text-pink-100 text-left",
                            // You can add an 'active' style here if needed
                        )}
                        title="Logout"
                    >
                        <LogOut className="h-5 w-5 mr-3 flex-shrink-0" />
                        <span className={clsx("truncate ml-1", { "": !isSidebarOpen && !isMobile })}>
                            Logout
                        </span>
                    </button>
                </div>
            </aside>
        </>
    );
};