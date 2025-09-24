import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Globe, ShoppingCart, Mail, MoreVertical } from "lucide-react";
import { apiClient } from "../../lib/api-client";
import type { BrowserProfile, BrowsingHistoryItem } from "../../types";

export function LeftPanel() {
  const [selectedProfile, setSelectedProfile] = useState<string>("default-profile");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: profiles = [] } = useQuery<BrowserProfile[]>({
    queryKey: ["/api/profiles"],
  });

  const { data: history = [] } = useQuery<BrowsingHistoryItem[]>({
    queryKey: ["/api/history", selectedProfile],
    enabled: !!selectedProfile,
  });

  const { data: searchResults = [] } = useQuery<BrowsingHistoryItem[]>({
    queryKey: ["/api/history", selectedProfile, "search", searchQuery],
    queryFn: () => apiClient.searchBrowsingHistory(selectedProfile, searchQuery),
    enabled: !!selectedProfile && !!searchQuery,
  });

  const displayHistory = searchQuery ? searchResults : history;

  const handleCreateProfile = () => {
    // TODO: Implement create profile modal
    console.log("Creating new profile...");
  };

  const handleLoadHistoryItem = (item: BrowsingHistoryItem) => {
    // TODO: Load the history item in the browser panel
    console.log("Loading history item:", item);
  };

  const handleExportSession = () => {
    // TODO: Implement session export
    console.log("Exporting session...");
  };

  const handleClearSession = () => {
    // TODO: Implement session clear with confirmation
    console.log("Clearing session...");
  };

  const getIconForUrl = (url: string) => {
    if (url.includes('wordpress.com') || url.includes('wp-admin')) {
      return <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">WP</div>;
    } else if (url.includes('gmail.com')) {
      return <Mail className="w-4 h-4 text-red-500" />;
    } else if (url.includes('shop') || url.includes('store') || url.includes('ecommerce')) {
      return <ShoppingCart className="w-4 h-4 text-green-500" />;
    }
    return <Globe className="w-4 h-4 text-muted-foreground" />;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="w-80 bg-card border-r border-border flex flex-col">
      {/* Panel Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-foreground">Browser Profiles</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCreateProfile}
            data-testid="button-create-profile"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Profile Selector */}
        <Select value={selectedProfile} onValueChange={setSelectedProfile}>
          <SelectTrigger data-testid="select-profile">
            <SelectValue placeholder="Select a profile" />
          </SelectTrigger>
          <SelectContent>
            {profiles.map((profile) => (
              <SelectItem key={profile.id} value={profile.id}>
                {profile.name}
                {profile.isDefault && <Badge variant="secondary" className="ml-2">Default</Badge>}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* History Section */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-border">
          <h3 className="font-medium text-foreground mb-3">Browsing History</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search history..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-history"
            />
          </div>
        </div>
        
        {/* History List */}
        <div className="flex-1 overflow-y-auto">
          {displayHistory.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {searchQuery ? "No matching history found" : "No browsing history"}
            </div>
          ) : (
            displayHistory.map((item) => (
              <Card
                key={item.id}
                className="m-2 p-3 border-border/50 hover:bg-muted/30 cursor-pointer group transition-colors"
                onClick={() => handleLoadHistoryItem(item)}
                data-testid={`history-item-${item.id}`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {getIconForUrl(item.url)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-foreground truncate">
                      {item.title || "Untitled Page"}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.url}
                    </p>
                    {item.summary && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {item.summary}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTimestamp(item.visitedAt)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Show context menu
                    }}
                  >
                    <MoreVertical className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
      
      {/* Session Management */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">Session Storage</span>
          <span className="text-accent font-medium" data-testid="text-session-size">
            {Math.round(Math.random() * 5 + 1)}.{Math.round(Math.random() * 9)} MB
          </span>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={handleExportSession}
            data-testid="button-export-session"
          >
            Export
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="flex-1"
            onClick={handleClearSession}
            data-testid="button-clear-session"
          >
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
