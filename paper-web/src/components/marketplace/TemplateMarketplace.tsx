import React, { useState, useMemo } from 'react';
import { Card, Button, Input, Badge, LoadingSpinner } from '../design-system';
import { getTemplateManager, Template } from '../../lib/marketplace/template-manager';

export const TemplateMarketplace: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [deploying, setDeploying] = useState<string | null>(null);
  const templateManager = getTemplateManager();

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'blog', label: 'Blog' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'ecommerce', label: 'E-commerce' },
    { id: 'api', label: 'API' },
    { id: 'fullstack', label: 'Full Stack' }
  ];

  const filteredTemplates = useMemo(() => {
    let templates = templateManager.getAllTemplates();

    if (searchQuery) {
      templates = templateManager.searchTemplates(searchQuery);
    }

    if (selectedCategory !== 'all') {
      templates = templates.filter(t => t.category === selectedCategory);
    }

    return templates;
  }, [searchQuery, selectedCategory, templateManager]);

  const handleDeploy = async (template: Template) => {
    setDeploying(template.id);

    try {
      const result = await templateManager.deployTemplate(template.id);

      if (result.success) {
        alert(`Template deployed successfully!\nURL: ${result.url}`);
      } else {
        alert(`Deployment failed: ${result.error}`);
      }
    } catch (error) {
      alert('Deployment failed');
    } finally {
      setDeploying(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2">
            Template Marketplace
          </h1>
          <p className="text-[var(--text-secondary)]">
            Deploy production-ready templates with one click
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <Input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />

          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-[var(--color-primary-500)] text-white'
                    : 'bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map(template => (
            <Card
              key={template.id}
              variant="elevated"
              padding="lg"
              hoverable
              className="flex flex-col"
            >
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-semibold text-[var(--text-primary)]">
                    {template.name}
                  </h3>
                  <Badge variant="primary" size="sm">
                    {template.framework}
                  </Badge>
                </div>

                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  {template.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {template.tags.slice(0, 3).map(tag => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-1 bg-[var(--bg-secondary)] rounded-full text-[var(--text-tertiary)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)] mb-4">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    {template.stars}
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {template.downloads}
                  </div>
                </div>
              </div>

              <Button
                variant="primary"
                onClick={() => handleDeploy(template)}
                disabled={deploying === template.id}
                className="w-full"
              >
                {deploying === template.id ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Deploying...
                  </>
                ) : (
                  'Deploy Now'
                )}
              </Button>
            </Card>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[var(--text-secondary)]">No templates found</p>
          </div>
        )}
      </div>
    </div>
  );
};
