export { default as ProjectGrid } from './components/ProjectGrid';
export { ProjectCard, ProjectFeature } from './components/ProjectCard';
export { CaseStudyViewTracker } from './components/CaseStudyViewTracker';
export {
	getFeaturedProjects,
	getFlagshipProject,
	getProject,
	getVerifiedGallery,
	isVerifiedMedia,
	projectCategories,
	projects,
} from './data/projects';
export type { Project, ProjectCategory, ProjectTemplate } from './data/projects';
