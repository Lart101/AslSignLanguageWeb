/**
 * Module Content Loader - Utility for loading module content across different pages
 * This file provides reusable functions for loading module data from Supabase
 * and can be used by various pages (alphabet.html, numbers.html, etc.)
 */

import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js';
import { config } from './config.js';

class ModuleContentLoader {
    constructor() {
        this.supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
        this.cache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes cache
    }

    /**
     * Load module data by name (e.g., 'alphabet', 'numbers', 'colors')
     * @param {string} moduleName - The name of the module to load
     * @returns {Promise<Object>} Module data with items and model info
     */
    async loadModuleByName(moduleName) {
        const cacheKey = `module_${moduleName}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheExpiry) {
                return cached.data;
            }
        }

        try {
            // Load module details
            const { data: module, error: moduleError } = await this.supabase
                .from('modules')
                .select('*')
                .eq('name', moduleName)
                .eq('is_active', true)
                .single();

            if (moduleError) {
                console.warn(`Module '${moduleName}' not found in database, using fallback`);
                return this.getFallbackModuleData(moduleName);
            }

            // Load module items
            const { data: items, error: itemsError } = await this.supabase
                .from('module_items')
                .select('*')
                .eq('module_id', module.id)
                .eq('is_active', true)
                .order('name');

            if (itemsError) {
                console.error('Error loading module items:', itemsError);
                return this.getFallbackModuleData(moduleName);
            }

            // Load associated model
            const { data: model, error: modelError } = await this.supabase
                .from('module_models')
                .select('*')
                .eq('module_id', module.id)
                .single();

            if (modelError && modelError.code !== 'PGRST116') {
                console.warn('No model found for module:', moduleName);
            }

            const moduleData = {
                module,
                items: items || [],
                model: model || null,
                hasAI: !!model,
                timestamp: Date.now()
            };

            // Cache the result
            this.cache.set(cacheKey, {
                data: moduleData,
                timestamp: Date.now()
            });

            return moduleData;

        } catch (error) {
            console.error('Error loading module:', error);
            return this.getFallbackModuleData(moduleName);
        }
    }

    /**
     * Load all available modules
     * @returns {Promise<Array>} Array of all active modules
     */
    async loadAllModules() {
        const cacheKey = 'all_modules';
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheExpiry) {
                return cached.data;
            }
        }

        try {
            const { data: modules, error } = await this.supabase
                .from('modules')
                .select('*')
                .eq('is_active', true)
                .order('name');

            if (error) throw error;

            // Cache the result
            this.cache.set(cacheKey, {
                data: modules,
                timestamp: Date.now()
            });

            return modules;

        } catch (error) {
            console.error('Error loading modules:', error);
            return this.getFallbackModulesList();
        }
    }

    /**
     * Load items for a specific module
     * @param {string} moduleId - The ID of the module
     * @returns {Promise<Array>} Array of module items
     */
    async loadModuleItems(moduleId) {
        try {
            const { data: items, error } = await this.supabase
                .from('module_items')
                .select('*')
                .eq('module_id', moduleId)
                .eq('is_active', true)
                .order('name');

            if (error) throw error;
            return items || [];

        } catch (error) {
            console.error('Error loading module items:', error);
            return [];
        }
    }

    /**
     * Get video URL for a specific item
     * @param {string} moduleName - Module name (e.g., 'alphabet')
     * @param {string} itemName - Item name (e.g., 'A', 'Hello')
     * @returns {string} Video URL path
     */
    getVideoUrl(moduleName, itemName) {
        // Handle special case mappings
        const moduleMap = {
            'alphabet': 'alphabet',
            'numbers': 'numbers',
            'colors': 'colors',
            'basic-words': 'basic_words',
            'basicWords': 'basic_words',
            'family': 'family',
            'food': 'food'
        };

        const mappedModule = moduleMap[moduleName] || moduleName;
        return `/static/sign_language_videos/${mappedModule}/${itemName}.mp4`;
    }

    /**
     * Get image URL for a specific item
     * @param {string} moduleName - Module name
     * @param {string} itemName - Item name
     * @returns {string} Image URL path
     */
    getImageUrl(moduleName, itemName) {
        const moduleMap = {
            'alphabet': 'alphabet',
            'numbers': 'numbers',
            'colors': 'colors',
            'basic-words': 'basic_words',
            'basicWords': 'basic_words',
            'family': 'family',
            'food': 'food'
        };

        const mappedModule = moduleMap[moduleName] || moduleName;
        return `/static/sign_language_images/${mappedModule}/${itemName}.jpg`;
    }

    /**
     * Fallback data when database is not available
     * @param {string} moduleName - Module name
     * @returns {Object} Fallback module data
     */
    getFallbackModuleData(moduleName) {
        const fallbackData = {
            alphabet: {
                module: {
                    id: 'fallback-alphabet',
                    name: 'alphabet',
                    description: 'Learn the ASL alphabet from A to Z'
                },
                items: this.generateAlphabetItems(),
                model: { model_path: '/static/models/letters.task' },
                hasAI: true
            },
            numbers: {
                module: {
                    id: 'fallback-numbers',
                    name: 'numbers',
                    description: 'Learn ASL numbers from 0 to 9'
                },
                items: this.generateNumberItems(),
                model: { model_path: '/static/models/numbers.task' },
                hasAI: true
            },
            colors: {
                module: {
                    id: 'fallback-colors',
                    name: 'colors',
                    description: 'Learn common color signs in ASL'
                },
                items: this.generateColorItems(),
                model: { model_path: '/static/models/colors.task' },
                hasAI: true
            },
            'basic-words': {
                module: {
                    id: 'fallback-basic-words',
                    name: 'basic-words',
                    description: 'Learn essential ASL vocabulary'
                },
                items: this.generateBasicWordItems(),
                model: { model_path: '/static/models/basicWords.task' },
                hasAI: true
            },
            family: {
                module: {
                    id: 'fallback-family',
                    name: 'family',
                    description: 'Learn family-related signs in ASL'
                },
                items: this.generateFamilyItems(),
                model: { model_path: '/static/models/family.task' },
                hasAI: true
            },
            food: {
                module: {
                    id: 'fallback-food',
                    name: 'food',
                    description: 'Learn food and drink signs in ASL'
                },
                items: this.generateFoodItems(),
                model: { model_path: '/static/models/food.task' },
                hasAI: true
            }
        };

        return fallbackData[moduleName] || {
            module: { id: 'unknown', name: moduleName, description: 'Unknown module' },
            items: [],
            model: null,
            hasAI: false
        };
    }

    /**
     * Generate alphabet items (A-Z)
     */
    generateAlphabetItems() {
        return Array.from({ length: 26 }, (_, i) => {
            const letter = String.fromCharCode(65 + i);
            return {
                id: `alphabet-${letter}`,
                name: letter,
                description: `Sign for letter ${letter}`,
                video_url: this.getVideoUrl('alphabet', letter),
                image_url: this.getImageUrl('alphabet', letter)
            };
        });
    }

    /**
     * Generate number items (0-9)
     */
    generateNumberItems() {
        return Array.from({ length: 10 }, (_, i) => ({
            id: `number-${i}`,
            name: i.toString(),
            description: `Sign for number ${i}`,
            video_url: this.getVideoUrl('numbers', i.toString()),
            image_url: this.getImageUrl('numbers', i.toString())
        }));
    }

    /**
     * Generate color items
     */
    generateColorItems() {
        const colors = ['Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple', 'Pink', 'Brown', 'Black', 'White'];
        return colors.map(color => ({
            id: `color-${color.toLowerCase()}`,
            name: color,
            description: `Sign for the color ${color.toLowerCase()}`,
            video_url: this.getVideoUrl('colors', color),
            image_url: this.getImageUrl('colors', color)
        }));
    }

    /**
     * Generate basic word items
     */
    generateBasicWordItems() {
        const words = ['Hello', 'Goodbye', 'Please', 'Thank You', 'Sorry', 'Yes', 'No', 'Good', 'Bad', 'Help'];
        return words.map(word => ({
            id: `basic-${word.toLowerCase().replace(' ', '-')}`,
            name: word,
            description: `Sign for "${word}"`,
            video_url: this.getVideoUrl('basic_words', word.replace(' ', '')),
            image_url: this.getImageUrl('basic_words', word.replace(' ', ''))
        }));
    }

    /**
     * Generate family items
     */
    generateFamilyItems() {
        const family = ['Mother', 'Father', 'Sister', 'Brother', 'Grandmother', 'Grandfather', 'Baby', 'Child', 'Family', 'Friend'];
        return family.map(member => ({
            id: `family-${member.toLowerCase()}`,
            name: member,
            description: `Sign for "${member}"`,
            video_url: this.getVideoUrl('family', member),
            image_url: this.getImageUrl('family', member)
        }));
    }

    /**
     * Generate food items
     */
    generateFoodItems() {
        const foods = ['Water', 'Milk', 'Bread', 'Apple', 'Banana', 'Pizza', 'Hamburger', 'Coffee', 'Tea', 'Cookie'];
        return foods.map(food => ({
            id: `food-${food.toLowerCase()}`,
            name: food,
            description: `Sign for "${food}"`,
            video_url: this.getVideoUrl('food', food),
            image_url: this.getImageUrl('food', food)
        }));
    }

    /**
     * Get fallback modules list
     */
    getFallbackModulesList() {
        return [
            { id: 'alphabet', name: 'alphabet', description: 'Learn the ASL alphabet' },
            { id: 'numbers', name: 'numbers', description: 'Learn ASL numbers' },
            { id: 'colors', name: 'colors', description: 'Learn color signs' },
            { id: 'basic-words', name: 'basic-words', description: 'Learn basic vocabulary' },
            { id: 'family', name: 'family', description: 'Learn family signs' },
            { id: 'food', name: 'food', description: 'Learn food signs' }
        ];
    }

    /**
     * Clear cache (useful for development)
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Check if module has AI model support
     * @param {string} moduleName - Module name
     * @returns {boolean} True if module has AI support
     */
    hasAISupport(moduleName) {
        const supportedModules = ['alphabet', 'numbers', 'colors', 'basic-words', 'family', 'food'];
        return supportedModules.includes(moduleName);
    }

    /**
     * Get model path for a module
     * @param {string} moduleName - Module name
     * @returns {string} Model file path
     */
    getModelPath(moduleName) {
        const modelMap = {
            'alphabet': '/static/models/letters.task',
            'numbers': '/static/models/numbers.task',
            'colors': '/static/models/colors.task',
            'basic-words': '/static/models/basicWords.task',
            'family': '/static/models/family.task',
            'food': '/static/models/food.task'
        };

        return modelMap[moduleName] || null;
    }

    /**
     * Utility function to capitalize words
     * @param {string} str - String to capitalize
     * @returns {string} Capitalized string
     */
    capitalizeWords(str) {
        return str.split(/[_\s-]+/).map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }
}

// Create a singleton instance
const moduleContentLoader = new ModuleContentLoader();

// Export for ES6 modules
export default moduleContentLoader;

// Also make available globally for non-module scripts
window.ModuleContentLoader = ModuleContentLoader;
window.moduleContentLoader = moduleContentLoader;
