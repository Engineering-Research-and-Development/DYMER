import { Component, inject, output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatIconModule } from '@angular/material/icon';
import { PageService } from '../page.service';
import { BuilderService } from '../builder.service';
import { PropertiesTemplatesComponent } from '../properties/properties.component';

@Component({
  selector: 'app-templates-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, MatIconModule, PropertiesTemplatesComponent],
  templateUrl: './sidebar.component.html',
})

export class SidebarTemplatesComponent {
  pageService = inject(PageService);
  builderService = inject(BuilderService);

  requestCreatePage = output<void>();
  requestAttachFile = output<string>();
  requestEditTemplate = output<any>();

  activeTab: 'components' | 'sections' | 'properties' | 'navigator' = 'components';

  searchQuery = signal('');

  filteredPages = computed(() => {
    const query = (this.searchQuery() || '').toLowerCase().trim();
    const pages = this.pageService.pages();
    if (!query) {
      return pages;
    }
    return pages.filter(page =>
      (page.title || '').toLowerCase().includes(query) ||
      (page.instance[0]._index || '').toLowerCase().includes(query)
    );
  });

  categories = [
    {
      name: 'Layout',
      expanded: true,
      items: [
        { name: 'Container', icon: 'crop_square', html: '<div data-dcat-map="" class="container mx-auto p-4 border border-dashed border-gray-300 min-h-[100px]"></div>', category: 'Layout' },
        { name: 'Grid Row', icon: 'view_column', html: '<div data-dcat-map="" class="grid grid-cols-2 gap-4 p-4 border border-dashed border-gray-300"><div class="p-4 border border-gray-200 bg-gray-50">Col 1</div><div class="p-4 border border-gray-200 bg-gray-50">Col 2</div></div>', category: 'Layout' },
        { name: 'Card', icon: 'web_asset', html: '<div data-dcat-map="" class="bg-white rounded-lg shadow-md p-6 mb-4"><h3 class="text-xl font-bold mb-2">Card Title</h3><p class="text-gray-600">Card content goes here.</p></div>', category: 'Layout' }
      ]
    },
    {
      name: 'Typography',
      expanded: false,
      items: [
        { name: 'Heading 1', icon: 'title', html: '<h1 data-dcat-map="" class="text-4xl font-bold text-gray-900 mb-4">Heading 1</h1>', category: 'Typography' },
        { name: 'Heading 2', icon: 'title', html: '<h2 data-dcat-map="" class="text-3xl font-semibold text-gray-800 mb-3">Heading 2</h2>', category: 'Typography' },
        { name: 'Paragraph', icon: 'short_text', html: '<p data-dcat-map="" class="text-base text-gray-600 leading-relaxed mb-4">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>', category: 'Typography' },
        { name: 'Blockquote', icon: 'format_quote', html: '<blockquote data-dcat-map="" class="border-l-4 border-blue-500 pl-4 italic text-gray-700 my-4">"This is a blockquote element."</blockquote>', category: 'Typography' }
      ]
    },
    {
      name: 'Elements',
      expanded: false,
      items: [
        { name: 'Button', icon: 'smart_button', html: '<button data-dcat-map="" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">Click Me</button>', category: 'Elements' },
        { name: 'Image', icon: 'image', html: '<img data-dcat-map="" src="https://picsum.photos/seed/nature/400/300" alt="Placeholder" class="rounded-lg shadow-sm w-full object-cover h-48" referrerpolicy="no-referrer" />', category: 'Elements' },
        { name: 'Input Text', icon: 'input', html: '<input dymer-model-element="" data-dcat-map="" type="text" placeholder="Enter text..." class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />', category: 'Elements' },
        { name: 'Textarea', icon: 'notes', html: '<textarea data-dcat-map="" placeholder="Enter long text..." rows="4" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"></textarea>', category: 'Elements' },
        { name: 'Select', icon: 'arrow_drop_down_circle', html: '<select data-dcat-map="" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"><option value="">Select an option</option><option value="1">Option 1</option><option value="2">Option 2</option></select>', category: 'Elements' },
        { name: 'Checkbox', icon: 'check_box', html: '<div data-dcat-map="" class="flex items-center gap-2"><input type="checkbox" id="check1" class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"><label for="check1" class="text-gray-700">Checkbox Label</label></div>', category: 'Elements' },
        { name: 'Radio', icon: 'radio_button_checked', html: '<div data-dcat-map="" class="flex items-center gap-2"><input type="radio" name="radio-group" id="radio1" class="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"><label for="radio1" class="text-gray-700">Radio Option</label></div>', category: 'Elements' },
        { name: 'Date Input', icon: 'calendar_today', html: '<input data-dcat-map="" type="date" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />', category: 'Elements' },
        { name: 'Color Picker', icon: 'palette', html: '<span data-dcat-map="" class="flex items-center gap-2"><input type="color" class="h-10 w-10 p-1 rounded border border-gray-300 cursor-pointer"><span class="text-gray-600">Pick a color</span></div>', category: 'Elements' },
        { name: 'Range Slider', icon: 'linear_scale', html: '<div data-dcat-map="" class="w-full"><label class="block text-sm font-medium text-gray-700 mb-1">Range</label><input type="range" min="0" max="100" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"></div>', category: 'Elements' },
        { name: 'File Upload', icon: 'upload_file', html: '<input data-dcat-map="" type="file" class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />', category: 'Elements' },
        { name: 'Progress Bar', icon: 'hourglass_bottom', html: '<div data-dcat-map="" class="w-full bg-gray-200 rounded-full h-2.5"><div class="bg-blue-600 h-2.5 rounded-full" style="width: 45%"></div></div>', category: 'Elements' },
        { name: 'Link', icon: 'link', html: '<a data-dcat-map="" href="#" class="text-blue-600 hover:text-blue-800 hover:underline">This is a link</a>', category: 'Elements' },
        { name: 'Video', icon: 'movie', html: '<video data-dcat-map="" controls class="w-full rounded-lg shadow-sm"><source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4">Your browser does not support the video tag.</video>', category: 'Elements' },
        { name: 'Audio', icon: 'audiotrack', html: '<audio data-dcat-map="" controls class="w-full"><source src="https://www.w3schools.com/html/horse.mp3" type="audio/mpeg">Your browser does not support the audio element.</audio>', category: 'Elements' },
        { name: 'Code', icon: 'code', html: '<code data-dcat-map="" class="bg-gray-100 rounded px-2 py-1 text-sm font-mono text-pink-600">const x = 10;</code>', category: 'Elements' },
        { name: 'Horizontal Rule', icon: 'horizontal_rule', html: '<hr data-dcat-map="" class="my-4 border-t border-gray-300" />', category: 'Elements' },
        { name: 'Form', icon: 'dynamic_form', html: '<form data-dcat-map="" class="space-y-4 p-4 border border-gray-200 rounded-lg bg-white"><div class="flex flex-col gap-1"><label class="text-sm font-medium text-gray-700">Email</label><input type="email" placeholder="user@example.com" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div><div class="flex flex-col gap-1"><label class="text-sm font-medium text-gray-700">Password</label><input type="password" placeholder="••••••••" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div><button type="submit" class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">Sign In</button></form>', category: 'Elements' },
        { name: 'Label', icon: 'label', html: '<label data-dcat-map="" class="block text-sm font-medium text-gray-700 mb-1">Label Text</label>', category: 'Elements' },
        { name: 'Span', icon: 'short_text', html: '<span data-dcat-map="" class="text-sm text-gray-500">Helper text or inline description</span>', category: 'Elements' },
        { name: 'Fieldset', icon: 'crop_free', html: '<fieldset data-dcat-map="" class="border border-gray-300 rounded-lg p-4"><legend class="px-2 text-sm font-medium text-gray-700">Group Title</legend><div class="space-y-2"><p class="text-sm text-gray-600">Form content goes here...</p></div></fieldset>', category: 'Elements' },
        { name: 'Unordered List', icon: 'format_list_bulleted', html: '<ul data-dcat-map="" class="list-disc list-inside space-y-1 text-gray-700"><li>List item 1</li><li>List item 2</li><li>List item 3</li></ul>', category: 'Elements' },
        { name: 'Ordered List', icon: 'format_list_numbered', html: '<ol data-dcat-map="" class="list-decimal list-inside space-y-1 text-gray-700"><li>First item</li><li>Second item</li><li>Third item</li></ol>', category: 'Elements' },
        { name: 'Table', icon: 'table_chart', html: '<table data-dcat-map="" class="min-w-full bg-white border border-gray-300"><thead><tr class="bg-gray-100"><th class="py-2 px-4 border-b text-left">Header 1</th><th class="py-2 px-4 border-b text-left">Header 2</th></tr></thead><tbody><tr><td class="py-2 px-4 border-b">Row 1, Cell 1</td><td class="py-2 px-4 border-b">Row 1, Cell 2</td></tr><tr><td class="py-2 px-4 border-b">Row 2, Cell 1</td><td class="py-2 px-4 border-b">Row 2, Cell 2</td></tr></tbody></table>', category: 'Elements' },
        { name: 'Iframe', icon: 'web', html: '<iframe data-dcat-map="" src="https://www.example.com" class="w-full h-64 border border-gray-300 rounded-lg" title="Iframe Example"></iframe>', category: 'Elements' },
        { name: 'Strong Text', icon: 'format_bold', html: '<strong data-dcat-map="" class="font-bold text-gray-900">Bold text</strong>', category: 'Elements' },
        { name: 'Small Text', icon: 'format_size', html: '<small data-dcat-map="" class="text-xs text-gray-500">Small fine print text</small>', category: 'Elements' }
      ]
    },
    {
      name: 'DYMER Base',
      expanded: false,
      items: [
        { name: 'Entity Status', icon: 'traffic', html: '<div data-dcat-map="" data-component-entitystatus data-vvveb-disabled class="row">{{{EntityStatus this}}}</div>', category: 'DYMER Base' },
        { name: 'Pagination', icon: 'pages', html: '<div data-dcat-map="" data-component-dpagination class="row" d-pagination-size="6">{{{DymerPagination this}}}</div>', category: 'DYMER Base' },
        { name: 'Geo Point', icon: 'location_on', html: '<div data-dcat-map="" class="geopointcontgrp form-group field-description"><label class="kms-title-label">Geo Point</label><div><div data-component-geopoint class="form-group"><input type="hidden" class="form-control" name="data[location][type]" value="Point"><label class="kms-title-label">Longitude</label><input type="number" class="form-control" name="data[location][coordinates][0]"><label class="kms-title-label">Latitudine</label><input type="number" class="form-control" name="data[location][coordinates][1]"></div></div></div>', category: 'DYMER Base' },
        { name: 'Relation', icon: 'hub', html: '<div data-dcat-map="" class="relationcontgrp form-group field-description"><label class="kms-title-label">Relation</label><div><div data-component-kmsrelation class="form-group" contenteditable="false" data-torelation=""><span contenteditable="false" class="inforelation">Relation</span> <i class="fa fa-code-fork rotandflip inforelation" aria-hidden="true"></i> <span contenteditable="false" class="torelation inforelation">......</span></div></div></div>', category: 'DYMER Base' },
        { name: 'Relation Picker', icon: 'settings_input_component', html: '<div data-dcat-map="" class="form-group"><label class="kms-title-label">Relation</label><div><div data-component-dymrelation class="form-group dymerselectpicker" data-torelation=""><span class="inforelation">Relation</span> <i class="fa fa-code-fork rotandflip inforelation" aria-hidden="true"></i> <span contenteditable="false" class="torelation inforelation">......</span></div></div></div>', category: 'DYMER Base' },
        { name: 'Dymer Input', icon: 'input', html: '<div data-dcat-map="" class="form-group"><label>Text</label><input data-component-dymerinput class="form-control" type="text"></div>', category: 'DYMER Base' },
        { name: 'Taxonomy', icon: 'category', html: '<div data-dcat-map="" class="form-group"><label class="kms-title-label">Taxonomy</label><div><div data-component-kmstaxonomy class="form-group dymertaxonomy" data-totaxonomy=""><span class="infotaxonomy">Taxonomy</span> <i class="fa fa-code-fork rotandflip infotaxonomy" aria-hidden="true"></i> <span contenteditable="false" class="totaxonomy infotaxonomy">......</span></div></div></div>', category: 'DYMER Base' },
        { name: 'Entity Tags', icon: 'tag', html: '<div data-dcat-map="" class="form-group"><label class="kms-title-label">Tags</label><div class="form-group repeatable first-repeatable"><div><label>Tag Name</label><input type="text" class="form-control col-12 span12" name="data[hashtags][0]"><small class="form-text text-muted">Insert tag</small></div><div class="action-br"><span class="btn btn-outline-primary btn-sm">+</span><span class="btn btn-outline-danger btn-sm act-remove">-</span></div></div></div>', category: 'DYMER Base' },
        { name: 'Tags View', icon: 'style', html: '<div data-dcat-map="" class="row dwhashlist">{{{DymerViewTags this.hashtags}}}</div>', category: 'DYMER Base' },
        { name: 'Link Details', icon: 'visibility', html: '<span data-dcat-map="" class="pull-right text-info" style="padding-top: 10px;cursor:pointer">View More</span>', category: 'DYMER Base' },
        { name: 'Dymer Image', icon: 'image', html: '<img data-dcat-map="" src="{{cdnpath}}api/entities/api/v1/entity/content/{{<object-key>.id}}">', category: 'DYMER Base' }
      ]
    },
    {
      name: 'Bootstrap 5',
      expanded: false,
      items: [
        { name: 'BS Container', icon: 'crop_square', html: '<div data-dcat-map="" class="container p-4 border border-dashed text-center">Bootstrap Container</div>', category: 'Bootstrap 5' },
        { name: 'BS Row/Col', icon: 'view_column', html: '<div data-dcat-map="" class="container"><div class="row"><div class="col-sm p-3 border bg-light">One of three columns</div><div class="col-sm p-3 border bg-light">One of three columns</div><div class="col-sm p-3 border bg-light">One of three columns</div></div></div>', category: 'Bootstrap 5' },
        { name: 'BS Button Primary', icon: 'smart_button', html: '<button data-dcat-map="" type="button" class="btn btn-primary">Primary</button>', category: 'Bootstrap 5' },
        { name: 'BS Button Secondary', icon: 'smart_button', html: '<button data-dcat-map="" type="button" class="btn btn-secondary">Secondary</button>', category: 'Bootstrap 5' },
        { name: 'BS Alert', icon: 'warning', html: '<div data-dcat-map="" class="alert alert-primary" role="alert">A simple primary alert—check it out!</div>', category: 'Bootstrap 5' },
        { name: 'BS Card', icon: 'web_asset', html: '<div data-dcat-map="" class="card" style="width: 18rem;"><img src="https://picsum.photos/seed/card/300/200" class="card-img-top" alt="..." referrerpolicy="no-referrer"><div class="card-body"><h5 class="card-title">Card title</h5><p class="card-text">Some quick example text to build on the card title and make up the bulk of the card\'s content.</p><a href="#" class="btn btn-primary">Go somewhere</a></div></div>', category: 'Bootstrap 5' },
        { name: 'BS Navbar', icon: 'menu', html: '<nav data-dcat-map="" class="navbar navbar-expand-lg bg-body-tertiary"><div class="container-fluid"><a class="navbar-brand" href="#">Navbar</a><button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation"><span class="navbar-toggler-icon"></span></button><div class="collapse navbar-collapse" id="navbarNav"><ul class="navbar-nav"><li class="nav-item"><a class="nav-link active" aria-current="page" href="#">Home</a></li><li class="nav-item"><a class="nav-link" href="#">Features</a></li><li class="nav-item"><a class="nav-link" href="#">Pricing</a></li></ul></div></div></nav>', category: 'Bootstrap 5' },
        { name: 'BS Input Group', icon: 'input', html: '<div data-dcat-map="" class="input-group mb-3"><span class="input-group-text" id="basic-addon1">@</span><input type="text" class="form-control" placeholder="Username" aria-label="Username" aria-describedby="basic-addon1"></div>', category: 'Bootstrap 5' },
        { name: 'BS List Group', icon: 'list', html: '<ul data-dcat-map="" class="list-group"><li class="list-group-item">An item</li><li class="list-group-item">A second item</li><li class="list-group-item">A third item</li></ul>', category: 'Bootstrap 5' },
        { name: 'BS Badge', icon: 'label', html: '<span data-dcat-map="" class="badge text-bg-primary">Primary</span>', category: 'Bootstrap 5' }
      ]
    },
    {
      name: 'Tailwind Base',
      expanded: false,
      items: [
        { name: 'Container', icon: 'crop_square', html: '<div data-dcat-map="" class="container mx-auto px-4 p-4 border border-dashed border-gray-300">Container Content</div>', category: 'Tailwind Base' },
        { name: 'Grid', icon: 'grid_view', html: '<div data-dcat-map="" class="grid grid-cols-1 md:grid-cols-3 gap-4"><div class="bg-gray-100 p-4 rounded border border-gray-200">1</div><div class="bg-gray-100 p-4 rounded border border-gray-200">2</div><div class="bg-gray-100 p-4 rounded border border-gray-200">3</div></div>', category: 'Tailwind Base' },
        { name: 'Flex Row', icon: 'view_column', html: '<div data-dcat-map="" class="flex flex-row gap-4 items-center"><div class="bg-gray-100 p-4 rounded border border-gray-200">Item 1</div><div class="bg-gray-100 p-4 rounded border border-gray-200">Item 2</div></div>', category: 'Tailwind Base' },
        { name: 'Flex Col', icon: 'view_stream', html: '<div data-dcat-map="" class="flex flex-col gap-4"><div class="bg-gray-100 p-4 rounded border border-gray-200">Item 1</div><div class="bg-gray-100 p-4 rounded border border-gray-200">Item 2</div></div>', category: 'Tailwind Base' },
        { name: 'Card', icon: 'web_asset', html: '<div data-dcat-map="" class="max-w-sm rounded overflow-hidden shadow-lg bg-white border border-gray-200"><img class="w-full" src="https://picsum.photos/seed/card/400/200" alt="Card image" referrerpolicy="no-referrer"><div class="px-6 py-4"><div class="font-bold text-xl mb-2">The Coldest Sunset</div><p class="text-gray-700 text-base">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Voluptatibus quia, nulla! Maiores et perferendis eaque, exercitationem praesentium nihil.</p></div><div class="px-6 pt-4 pb-2"><span class="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">#photography</span><span class="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">#travel</span><span class="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">#winter</span></div></div>', category: 'Tailwind Base' },
        { name: 'Button', icon: 'smart_button', html: '<button data-dcat-map="" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors">Button</button>', category: 'Tailwind Base' },
        { name: 'Alert', icon: 'warning', html: '<div data-dcat-map="" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert"><strong class="font-bold">Holy smokes!</strong><span class="block sm:inline"> Something seriously bad happened.</span></div>', category: 'Tailwind Base' },
        { name: 'Badge', icon: 'label', html: '<span data-dcat-map="" class="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">Badge</span>', category: 'Tailwind Base' },
        { name: 'Input Group', icon: 'input', html: '<div data-dcat-map="" class="w-full max-w-xs"><label class="block text-gray-700 text-sm font-bold mb-2" for="username">Username</label><input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="username" type="text" placeholder="Username"></div>', category: 'Tailwind Base' },
        { name: 'Navbar', icon: 'menu', html: '<nav data-dcat-map="" class="flex items-center justify-between flex-wrap bg-teal-500 p-6"><div class="flex items-center flex-shrink-0 text-white mr-6"><span class="font-semibold text-xl tracking-tight">Tailwind CSS</span></div><div class="block lg:hidden"><button class="flex items-center px-3 py-2 border rounded text-teal-200 border-teal-400 hover:text-white hover:border-white"><svg class="fill-current h-3 w-3" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><title>Menu</title><path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z"/></svg></button></div><div class="w-full block flex-grow lg:flex lg:items-center lg:w-auto"><div class="text-sm lg:flex-grow"><a href="#responsive-header" class="block mt-4 lg:inline-block lg:mt-0 text-teal-200 hover:text-white mr-4">Docs</a><a href="#responsive-header" class="block mt-4 lg:inline-block lg:mt-0 text-teal-200 hover:text-white mr-4">Examples</a><a href="#responsive-header" class="block mt-4 lg:inline-block lg:mt-0 text-teal-200 hover:text-white">Blog</a></div><div><a href="#" class="inline-block text-sm px-4 py-2 leading-none border rounded text-white border-white hover:border-transparent hover:text-teal-500 hover:bg-white mt-4 lg:mt-0">Download</a></div></div></nav>', category: 'Tailwind Base' },
        { name: 'Footer', icon: 'maximize', html: '<footer data-dcat-map="" class="bg-white rounded-lg shadow m-4 dark:bg-gray-800"><div class="w-full mx-auto max-w-screen-xl p-4 md:flex md:items-center md:justify-between"><span class="text-sm text-gray-500 sm:text-center dark:text-gray-400">© 2023 <a href="https://flowbite.com/" class="hover:underline">Flowbite™</a>. All Rights Reserved.</span><ul class="flex flex-wrap items-center mt-3 text-sm font-medium text-gray-500 dark:text-gray-400 sm:mt-0"><li><a href="#" class="hover:underline me-4 md:me-6">About</a></li><li><a href="#" class="hover:underline me-4 md:me-6">Privacy Policy</a></li><li><a href="#" class="hover:underline me-4 md:me-6">Licensing</a></li><li><a href="#" class="hover:underline">Contact</a></li></ul></div></footer>', category: 'Tailwind Base' }
      ]
    },
    {
      name: 'Interactive',
      expanded: false,
      items: [
        { name: 'Accordion', icon: 'view_day', html: '<div data-dcat-map="" class="w-full border border-gray-200 rounded-lg overflow-hidden"><details class="group border-b border-gray-200 last:border-0"><summary class="flex justify-between items-center font-medium cursor-pointer list-none p-4 bg-gray-50 hover:bg-gray-100 transition-colors"><span>Accordion Item 1</span><span class="transition group-open:rotate-180"><svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg></span></summary><div class="p-4 text-gray-600 bg-white"><p>Content for accordion item 1.</p></div></details><details class="group border-b border-gray-200 last:border-0"><summary class="flex justify-between items-center font-medium cursor-pointer list-none p-4 bg-gray-50 hover:bg-gray-100 transition-colors"><span>Accordion Item 2</span><span class="transition group-open:rotate-180"><svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg></span></summary><div class="p-4 text-gray-600 bg-white"><p>Content for accordion item 2.</p></div></details></div>', category: 'Interactive' },
        { name: 'Tabs', icon: 'tab', html: '<div data-dcat-map="" class="w-full"><div class="flex border-b border-gray-200"><button class="px-4 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600 focus:outline-none">Tab 1</button><button class="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 focus:outline-none">Tab 2</button><button class="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 focus:outline-none">Tab 3</button></div><div class="p-4 bg-white border border-t-0 border-gray-200"><div class="block"><p class="text-gray-600">Content for Tab 1</p></div></div></div>', category: 'Interactive' }
      ]
    },
    {
      name: 'Social',
      expanded: false,
      items: [
        { name: 'Social Icon', icon: 'thumb_up', html: '<a data-dcat-map="" href="#" class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clip-rule="evenodd"></path></svg></a>', category: 'Social' },
        { name: 'Twitter Embed', icon: 'chat', html: '<blockquote data-dcat-map="" class="twitter-tweet"><p lang="en" dir="ltr">Just setting up my twttr</p>&mdash; jack (@jack) <a href="https://twitter.com/jack/status/20?ref_src=twsrc%5Etfw">March 21, 2006</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>', category: 'Social' },
        { name: 'YouTube Embed', icon: 'play_circle_filled', html: '<div data-dcat-map="" class="aspect-w-16 aspect-h-9"><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="w-full h-64 rounded-lg shadow-md"></iframe></div>', category: 'Social' },
        { name: 'Instagram Embed', icon: 'photo_camera', html: '<blockquote data-dcat-map="" class="instagram-media" data-instgrm-permalink="https://www.instagram.com/p/C-000000000/?utm_source=ig_embed&amp;utm_campaign=loading" data-instgrm-version="14" style=" background:#FFF; border:0; border-radius:3px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 1px; max-width:540px; min-width:326px; padding:0; width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);"></blockquote> <script async src="//www.instagram.com/embed.js"></script>', category: 'Social' },
        { name: 'Facebook Embed', icon: 'facebook', html: '<div data-dcat-map="" class="fb-post" data-href="https://www.facebook.com/20531316728/posts/10154009990506729/" data-width="500" data-show-text="true"></div><script async defer crossorigin="anonymous" src="https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v17.0" nonce="12345"></script>', category: 'Social' },
        { name: 'LinkedIn Embed', icon: 'work', html: '<iframe data-dcat-map="" src="https://www.linkedin.com/embed/feed/update/urn:li:share:6900000000000000000" height="282" width="504" frameborder="0" allowfullscreen="" title="Embedded post" class="rounded-lg shadow-md border border-gray-200"></iframe>', category: 'Social' },
        { name: 'Spotify Embed', icon: 'music_note', html: '<iframe data-dcat-map="" style="border-radius:12px" src="https://open.spotify.com/embed/track/4cOdK2wGLETKBW3PvgPWqT?utm_source=generator" width="100%" height="152" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>', category: 'Social' }
      ]
    },
    {
      name: 'Charts',
      expanded: true,
      items: [
        { name: 'Bar Chart', icon: 'bar_chart', html: '<img data-dcat-map="" data-component-chart="true" data-chart-type="bar" data-datasource="" data-label-field="" data-value-field="" class="w-full h-64 bg-white border border-gray-200 rounded-lg p-4 relative"><canvas></canvas><script>setTimeout(async()=>{const s=document.currentScript;if(!s)return;const c=s.parentElement,cv=c.querySelector("canvas");if(!cv)return;const t=c.getAttribute("data-chart-type")||"bar",ds=c.getAttribute("data-datasource"),lf=c.getAttribute("data-label-field"),vf=c.getAttribute("data-value-field");if(!ds||!lf)return;if(!window.Chart)await new Promise(r=>{const sc=document.createElement("script");sc.src="https://cdn.jsdelivr.net/npm/chart.js";sc.onload=r;document.head.appendChild(sc)});try{const res=await fetch(ds),d=await res.json(),i=Array.isArray(d)?d:(d.features||d.data||d.items||[]);const rp=(o,p)=>p.split(".").reduce((a,b)=>a&&a[b]!==undefined?a[b]:undefined,o),ag={};i.forEach(it=>{const l=String(rp(it,lf)||"Unknown"),v=vf?(Number(rp(it,vf))||0):1;ag[l]=(ag[l]||0)+v});const ct=t==="gauge"?"doughnut":t,op={responsive:!0,maintainAspectRatio:!1};if(t==="gauge"){op.circumference=180;op.rotation=-90}new Chart(cv,{type:ct,data:{labels:Object.keys(ag),datasets:[{label:"Dataset",data:Object.values(ag),borderWidth:1}]},options:op})}catch(e){console.error(e)}},100);</script></div>', category: 'Charts' },
        { name: 'Line Chart', icon: 'show_chart', html: '<img data-dcat-map="" data-component-chart="true" data-chart-type="line" data-datasource="" data-label-field="" data-value-field="" class="w-full h-64 bg-white border border-gray-200 rounded-lg p-4 relative"><canvas></canvas><script>setTimeout(async()=>{const s=document.currentScript;if(!s)return;const c=s.parentElement,cv=c.querySelector("canvas");if(!cv)return;const t=c.getAttribute("data-chart-type")||"line",ds=c.getAttribute("data-datasource"),lf=c.getAttribute("data-label-field"),vf=c.getAttribute("data-value-field");if(!ds||!lf)return;if(!window.Chart)await new Promise(r=>{const sc=document.createElement("script");sc.src="https://cdn.jsdelivr.net/npm/chart.js";sc.onload=r;document.head.appendChild(sc)});try{const res=await fetch(ds),d=await res.json(),i=Array.isArray(d)?d:(d.features||d.data||d.items||[]);const rp=(o,p)=>p.split(".").reduce((a,b)=>a&&a[b]!==undefined?a[b]:undefined,o),ag={};i.forEach(it=>{const l=String(rp(it,lf)||"Unknown"),v=vf?(Number(rp(it,vf))||0):1;ag[l]=(ag[l]||0)+v});const ct=t==="gauge"?"doughnut":t,op={responsive:!0,maintainAspectRatio:!1};if(t==="gauge"){op.circumference=180;op.rotation=-90}new Chart(cv,{type:ct,data:{labels:Object.keys(ag),datasets:[{label:"Dataset",data:Object.values(ag),borderWidth:1}]},options:op})}catch(e){console.error(e)}},100);</script></div>', category: 'Charts' },
        { name: 'Pie Chart', icon: 'pie_chart', html: '<img data-dcat-map="" data-component-chart="true" data-chart-type="pie" data-datasource="" data-label-field="" data-value-field="" class="w-full h-64 bg-white border border-gray-200 rounded-lg p-4 relative"><canvas></canvas><script>setTimeout(async()=>{const s=document.currentScript;if(!s)return;const c=s.parentElement,cv=c.querySelector("canvas");if(!cv)return;const t=c.getAttribute("data-chart-type")||"pie",ds=c.getAttribute("data-datasource"),lf=c.getAttribute("data-label-field"),vf=c.getAttribute("data-value-field");if(!ds||!lf)return;if(!window.Chart)await new Promise(r=>{const sc=document.createElement("script");sc.src="https://cdn.jsdelivr.net/npm/chart.js";sc.onload=r;document.head.appendChild(sc)});try{const res=await fetch(ds),d=await res.json(),i=Array.isArray(d)?d:(d.features||d.data||d.items||[]);const rp=(o,p)=>p.split(".").reduce((a,b)=>a&&a[b]!==undefined?a[b]:undefined,o),ag={};i.forEach(it=>{const l=String(rp(it,lf)||"Unknown"),v=vf?(Number(rp(it,vf))||0):1;ag[l]=(ag[l]||0)+v});const ct=t==="gauge"?"doughnut":t,op={responsive:!0,maintainAspectRatio:!1};if(t==="gauge"){op.circumference=180;op.rotation=-90}new Chart(cv,{type:ct,data:{labels:Object.keys(ag),datasets:[{label:"Dataset",data:Object.values(ag),borderWidth:1}]},options:op})}catch(e){console.error(e)}},100);</script></div>', category: 'Charts' },
        { name: 'Gauge Chart', icon: 'speed', html: '<img data-dcat-map="" data-component-chart="true" data-chart-type="gauge" data-datasource="" data-label-field="" data-value-field="" class="w-full h-64 bg-white border border-gray-200 rounded-lg p-4 relative"><canvas></canvas><script>setTimeout(async()=>{const s=document.currentScript;if(!s)return;const c=s.parentElement,cv=c.querySelector("canvas");if(!cv)return;const t=c.getAttribute("data-chart-type")||"gauge",ds=c.getAttribute("data-datasource"),lf=c.getAttribute("data-label-field"),vf=c.getAttribute("data-value-field");if(!ds||!lf)return;if(!window.Chart)await new Promise(r=>{const sc=document.createElement("script");sc.src="https://cdn.jsdelivr.net/npm/chart.js";sc.onload=r;document.head.appendChild(sc)});try{const res=await fetch(ds),d=await res.json(),i=Array.isArray(d)?d:(d.features||d.data||d.items||[]);const rp=(o,p)=>p.split(".").reduce((a,b)=>a&&a[b]!==undefined?a[b]:undefined,o),ag={};i.forEach(it=>{const l=String(rp(it,lf)||"Unknown"),v=vf?(Number(rp(it,vf))||0):1;ag[l]=(ag[l]||0)+v});const ct=t==="gauge"?"doughnut":t,op={responsive:!0,maintainAspectRatio:!1};if(t==="gauge"){op.circumference=180;op.rotation=-90}new Chart(cv,{type:ct,data:{labels:Object.keys(ag),datasets:[{label:"Dataset",data:Object.values(ag),borderWidth:1}]},options:op})}catch(e){console.error(e)}},100);</script></div>', category: 'Charts' }
      ]
    },
    {
      name: 'Dymer Charts',
      expanded: true,
      items: [
        {
          name: 'Horizontal Bar',
          icon: 'horizontal_distribute',
          html: '<div data-dcat-map="" data-component-dymer-chart="true" data-chart-type="horizontal-bar" data-datasource="" data-label-field="" data-value-field="" class="bg-white border border-gray-200 rounded-xl shadow-sm p-6 w-full max-w-4xl font-sans"><div class="flex justify-between items-center mb-6"><h3 class="text-lg font-bold text-gray-900 m-0">Services benchmark</h3><span class="bg-blue-50 text-blue-700 text-sm font-medium px-3 py-1 rounded-full border border-blue-100">Total: 1961</span></div><div class="space-y-4"><div class="flex items-center gap-4"><div class="w-24 text-sm font-bold text-gray-600 truncate">Data</div><div class="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden"><div class="h-full bg-blue-600 rounded-full" style="width: 60%"></div></div><div class="w-12 text-right text-sm text-gray-600">308</div></div><div class="flex items-center gap-4"><div class="w-24 text-sm font-bold text-gray-600 truncate">Business</div><div class="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden"><div class="h-full bg-blue-500 rounded-full" style="width: 90%"></div></div><div class="w-12 text-right text-sm text-gray-600">514</div></div><div class="flex items-center gap-4"><div class="w-24 text-sm font-bold text-gray-600 truncate">Ecosystem</div><div class="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden"><div class="h-full bg-blue-400 rounded-full" style="width: 75%"></div></div><div class="w-12 text-right text-sm text-gray-600">401</div></div></div><div class="mt-6 pt-4 border-t border-gray-100 text-sm text-gray-500">Benchmark = numero servizi filtrati per macro DBEST.</div></div>',
          category: 'Dymer Charts'
        }
      ]
    }
  ];

  sections = [
    {
      name: 'Hero',
      expanded: false,
      items: [
        {
          name: 'Simple Hero',
          icon: 'web_asset',
          html: '<section data-dcat-map="" class="bg-white dark:bg-gray-900 py-20"><div class="container mx-auto px-4 text-center"><h1 class="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Welcome to Our Service</h1><p class="text-xl text-gray-600 dark:text-gray-300 mb-8">We create amazing experiences for our customers.</p><div class="flex justify-center gap-4"><button class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">Get Started</button><button class="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300">Learn More</button></div></div></section>',
          category: 'Hero'
        },
        {
          name: 'Hero with Image',
          icon: 'image',
          html: '<section data-dcat-map="" class="bg-gray-50 dark:bg-gray-800 py-16"><div class="container mx-auto px-4 flex flex-col md:flex-row items-center"><div class="md:w-1/2 mb-8 md:mb-0"><h1 class="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Grow Your Business</h1><p class="text-lg text-gray-600 dark:text-gray-300 mb-6">Leverage our tools to scale your operations effectively.</p><button class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">Start Now</button></div><div class="md:w-1/2"><img src="https://picsum.photos/seed/business/600/400" alt="Hero Image" class="rounded-lg shadow-lg w-full" referrerpolicy="no-referrer"></div></div></section>',
          category: 'Hero'
        },
        {
          name: 'Hero Center Gradient',
          icon: 'gradient',
          html: '<section data-dcat-map="" class="bg-gradient-to-r from-blue-600 to-indigo-700 py-24"><div class="container mx-auto px-4 text-center"><h1 class="text-5xl font-extrabold mb-6 text-white tracking-tight">Build Faster, Scale Better</h1><p class="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">The ultimate platform for modern teams to collaborate and ship products at lightning speed.</p><div class="flex justify-center gap-4"><button class="bg-white text-blue-700 font-bold px-8 py-4 rounded-full shadow-lg hover:bg-gray-50 transition-colors">Start Free Trial</button><button class="bg-transparent border-2 border-white text-white font-bold px-8 py-4 rounded-full hover:bg-white/10 transition-colors">View Demo</button></div></div></section>',
          category: 'Hero'
        },
        {
          name: 'Hero Split Form',
          icon: 'dynamic_form',
          html: '<section data-dcat-map="" class="bg-white dark:bg-gray-900 py-20"><div class="container mx-auto px-4 flex flex-col lg:flex-row items-center gap-12"><div class="lg:w-1/2"><h1 class="text-4xl lg:text-5xl font-bold mb-6 text-gray-900 dark:text-white leading-tight">Transform your workflow today</h1><p class="text-lg text-gray-600 dark:text-gray-400 mb-8">Join over 10,000 companies that use our platform to streamline their operations and boost productivity.</p><ul class="space-y-4 mb-8"><li class="flex items-center text-gray-700 dark:text-gray-300"><svg class="w-6 h-6 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> No credit card required</li><li class="flex items-center text-gray-700 dark:text-gray-300"><svg class="w-6 h-6 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> 14-day free trial</li><li class="flex items-center text-gray-700 dark:text-gray-300"><svg class="w-6 h-6 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Cancel anytime</li></ul></div><div class="lg:w-1/2 w-full max-w-md"><div class="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700"><h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Get Started Free</h3><form class="space-y-4"><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Work Email</label><input type="email" class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="name@company.com"></div><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label><input type="password" class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="••••••••"></div><button class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">Create Account</button><p class="text-xs text-center text-gray-500 mt-4">By signing up, you agree to our Terms and Privacy Policy.</p></form></div></div></div></section>',
          category: 'Hero'
        }
      ]
    },
    {
      name: 'Features',
      expanded: false,
      items: [
        {
          name: '3 Column Features',
          icon: 'view_column',
          html: '<section data-dcat-map="" class="py-16 bg-white dark:bg-gray-900"><div class="container mx-auto px-4"><h2 class="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">Our Features</h2><div class="grid md:grid-cols-3 gap-8"><div class="text-center p-6"><div class="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><span class="text-2xl">🚀</span></div><h3 class="text-xl font-bold mb-2 text-gray-900 dark:text-white">Fast Performance</h3><p class="text-gray-600 dark:text-gray-400">Optimized for speed and efficiency.</p></div><div class="text-center p-6"><div class="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><span class="text-2xl">🛡️</span></div><h3 class="text-xl font-bold mb-2 text-gray-900 dark:text-white">Secure</h3><p class="text-gray-600 dark:text-gray-400">Your data is safe with us.</p></div><div class="text-center p-6"><div class="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><span class="text-2xl">⚙️</span></div><h3 class="text-xl font-bold mb-2 text-gray-900 dark:text-white">Customizable</h3><p class="text-gray-600 dark:text-gray-400">Tailor it to your needs.</p></div></div></div></section>',
          category: 'Features'
        },
        {
          name: 'Feature Grid 2x2',
          icon: 'grid_view',
          html: '<section data-dcat-map="" class="py-20 bg-gray-50 dark:bg-gray-800"><div class="container mx-auto px-4"><div class="text-center max-w-3xl mx-auto mb-16"><h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">Everything you need to succeed</h2><p class="text-lg text-gray-600 dark:text-gray-400">Our platform provides all the tools necessary to build, deploy, and scale your applications with ease.</p></div><div class="grid md:grid-cols-2 gap-10"><div class="flex gap-4"><div class="flex-shrink-0 mt-1"><div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg></div></div><div><h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Lightning Fast</h3><p class="text-gray-600 dark:text-gray-400">Experience unparalleled speed with our globally distributed edge network and optimized infrastructure.</p></div></div><div class="flex gap-4"><div class="flex-shrink-0 mt-1"><div class="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg flex items-center justify-center"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg></div></div><div><h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Bank-grade Security</h3><p class="text-gray-600 dark:text-gray-400">Rest easy knowing your data is protected by industry-leading encryption and security protocols.</p></div></div><div class="flex gap-4"><div class="flex-shrink-0 mt-1"><div class="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg flex items-center justify-center"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg></div></div><div><h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Scalable Database</h3><p class="text-gray-600 dark:text-gray-400">Our database automatically scales to handle millions of requests without breaking a sweat.</p></div></div><div class="flex gap-4"><div class="flex-shrink-0 mt-1"><div class="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg flex items-center justify-center"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"></path></svg></div></div><div><h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">24/7 Support</h3><p class="text-gray-600 dark:text-gray-400">Our expert team is always available to help you resolve any issues and keep your business running smoothly.</p></div></div></div></div></section>',
          category: 'Features'
        },
        {
          name: 'Feature Alternating',
          icon: 'swap_vert',
          html: '<section data-dcat-map="" class="py-20 bg-white dark:bg-gray-900 overflow-hidden"><div class="container mx-auto px-4"><div class="flex flex-col md:flex-row items-center gap-12 mb-24"><div class="md:w-1/2"><img src="https://picsum.photos/seed/feature1/600/400" alt="Feature 1" class="rounded-2xl shadow-xl w-full" referrerpolicy="no-referrer"></div><div class="md:w-1/2 lg:pl-10"><div class="inline-block px-3 py-1 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-sm font-semibold mb-4">Analytics</div><h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Gain deep insights into your data</h2><p class="text-lg text-gray-600 dark:text-gray-400 mb-6">Our powerful analytics engine processes millions of data points in real-time to give you actionable insights that drive growth.</p><ul class="space-y-3"><li class="flex items-center text-gray-700 dark:text-gray-300"><mat-icon class="text-blue-500 mr-2 text-sm">check_circle</mat-icon> Real-time dashboards</li><li class="flex items-center text-gray-700 dark:text-gray-300"><mat-icon class="text-blue-500 mr-2 text-sm">check_circle</mat-icon> Custom reporting</li><li class="flex items-center text-gray-700 dark:text-gray-300"><mat-icon class="text-blue-500 mr-2 text-sm">check_circle</mat-icon> Export to CSV/PDF</li></ul></div></div><div class="flex flex-col md:flex-row-reverse items-center gap-12"><div class="md:w-1/2"><img src="https://picsum.photos/seed/feature2/600/400" alt="Feature 2" class="rounded-2xl shadow-xl w-full" referrerpolicy="no-referrer"></div><div class="md:w-1/2 lg:pr-10"><div class="inline-block px-3 py-1 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-full text-sm font-semibold mb-4">Automation</div><h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Automate your repetitive tasks</h2><p class="text-lg text-gray-600 dark:text-gray-400 mb-6">Set up complex workflows in minutes with our drag-and-drop builder. Let our system handle the busywork while you focus on strategy.</p><a href="#" class="inline-flex items-center text-blue-600 dark:text-blue-400 font-semibold hover:underline">Learn more about automation <mat-icon class="ml-1 text-sm">arrow_forward</mat-icon></a></div></div></div></section>',
          category: 'Features'
        }
      ]
    },
    {
      name: 'Service',
      expanded: false,
      items: [
        {
          name: 'Service List',
          icon: 'list',
          html: '<section data-dcat-map="" class="py-16 bg-gray-50 dark:bg-gray-800"><div class="container mx-auto px-4"><h2 class="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">Our Services</h2><div class="grid md:grid-cols-2 gap-8"><div class="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm"><h3 class="text-xl font-bold mb-2 text-blue-600">Web Development</h3><p class="text-gray-600 dark:text-gray-300">Building responsive and modern websites.</p></div><div class="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm"><h3 class="text-xl font-bold mb-2 text-blue-600">Mobile Apps</h3><p class="text-gray-600 dark:text-gray-300">Native and cross-platform mobile solutions.</p></div><div class="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm"><h3 class="text-xl font-bold mb-2 text-blue-600">UI/UX Design</h3><p class="text-gray-600 dark:text-gray-300">Creating intuitive user interfaces.</p></div><div class="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm"><h3 class="text-xl font-bold mb-2 text-blue-600">Consulting</h3><p class="text-gray-600 dark:text-gray-300">Expert advice for your digital strategy.</p></div></div></div></section>',
          category: 'Service'
        }
      ]
    },
    {
      name: 'Clients',
      expanded: false,
      items: [
        {
          name: 'Client Logos',
          icon: 'groups',
          html: '<section data-dcat-map="" class="py-12 bg-white dark:bg-gray-900"><div class="container mx-auto px-4"><p class="text-center text-gray-500 mb-8 uppercase tracking-widest text-sm">Trusted by</p><div class="flex flex-wrap justify-center items-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all"><div class="text-2xl font-bold text-gray-400">GOOGLE</div><div class="text-2xl font-bold text-gray-400">AMAZON</div><div class="text-2xl font-bold text-gray-400">MICROSOFT</div><div class="text-2xl font-bold text-gray-400">SPOTIFY</div></div></div></section>',
          category: 'Clients'
        }
      ]
    },
    {
      name: 'Contact Form',
      expanded: false,
      items: [
        {
          name: 'Simple Contact',
          icon: 'contact_mail',
          html: '<section data-dcat-map="" class="py-16 bg-white dark:bg-gray-900"><div class="container mx-auto px-4 max-w-lg"><h2 class="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">Contact Us</h2><form class="space-y-4"><div class="flex flex-col"><label class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Name</label><input type="text" class="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white"></div><div class="flex flex-col"><label class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Email</label><input type="email" class="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white"></div><div class="flex flex-col"><label class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Message</label><textarea rows="4" class="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white"></textarea></div><button type="button" class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium">Send Message</button></form></div></section>',
          category: 'Contact Form'
        },
        {
          name: 'Contact Split Info',
          icon: 'contact_phone',
          html: '<section data-dcat-map="" class="py-20 bg-gray-50 dark:bg-gray-800"><div class="container mx-auto px-4"><div class="max-w-5xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden"><div class="flex flex-col md:flex-row"><div class="md:w-1/3 bg-blue-600 text-white p-10"><h3 class="text-2xl font-bold mb-6">Get in touch</h3><p class="text-blue-100 mb-10">We\'d love to hear from you. Our friendly team is always here to chat.</p><div class="space-y-6"><div class="flex items-start"><mat-icon class="mr-4 mt-1">email</mat-icon><div><h4 class="font-semibold">Chat to us</h4><p class="text-blue-200 text-sm mt-1">Our friendly team is here to help.</p><p class="font-medium mt-1">hi@company.com</p></div></div><div class="flex items-start"><mat-icon class="mr-4 mt-1">location_on</mat-icon><div><h4 class="font-semibold">Visit us</h4><p class="text-blue-200 text-sm mt-1">Come say hello at our office HQ.</p><p class="font-medium mt-1">100 Smith Street<br>Collingwood VIC 3066 AU</p></div></div><div class="flex items-start"><mat-icon class="mr-4 mt-1">phone</mat-icon><div><h4 class="font-semibold">Call us</h4><p class="text-blue-200 text-sm mt-1">Mon-Fri from 8am to 5pm.</p><p class="font-medium mt-1">+1 (555) 000-0000</p></div></div></div></div><div class="md:w-2/3 p-10"><form class="space-y-6"><div class="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">First name</label><input type="text" class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="First name"></div><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Last name</label><input type="text" class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Last name"></div></div><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label><input type="email" class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="you@company.com"></div><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Message</label><textarea rows="4" class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Leave us a message..."></textarea></div><button type="button" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">Send message</button></form></div></div></div></div></section>',
          category: 'Contact Form'
        }
      ]
    },
    {
      name: 'Counter',
      expanded: false,
      items: [
        {
          name: 'Stats Counter',
          icon: 'numbers',
          html: '<section data-dcat-map="" class="py-16 bg-blue-600 text-white"><div class="container mx-auto px-4"><div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"><div><div class="text-4xl font-bold mb-2">10k+</div><div class="text-blue-100">Users</div></div><div><div class="text-4xl font-bold mb-2">500+</div><div class="text-blue-100">Projects</div></div><div><div class="text-4xl font-bold mb-2">99%</div><div class="text-blue-100">Satisfaction</div></div><div><div class="text-4xl font-bold mb-2">24/7</div><div class="text-blue-100">Support</div></div></div></div></section>',
          category: 'Counter'
        }
      ]
    },
    {
      name: 'CTA',
      expanded: false,
      items: [
        {
          name: 'Simple CTA',
          icon: 'call_to_action',
          html: '<section data-dcat-map="" class="py-16 bg-gray-100 dark:bg-gray-800"><div class="container mx-auto px-4 text-center"><h2 class="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Ready to get started?</h2><p class="text-xl text-gray-600 dark:text-gray-300 mb-8">Join thousands of satisfied customers today.</p><button class="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 shadow-lg transition-transform hover:scale-105">Sign Up Now</button></div></section>',
          category: 'CTA'
        },
        {
          name: 'CTA Split',
          icon: 'splitscreen',
          html: '<section data-dcat-map="" class="py-20 bg-blue-600"><div class="container mx-auto px-4"><div class="flex flex-col md:flex-row items-center justify-between"><div class="md:w-2/3 mb-8 md:mb-0"><h2 class="text-3xl md:text-4xl font-bold text-white mb-4">Boost your productivity today.</h2><p class="text-xl text-blue-100">Start using our platform and see the difference in your workflow immediately.</p></div><div class="md:w-1/3 flex justify-end gap-4"><button class="bg-white text-blue-600 font-bold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors">Get Started</button><button class="bg-blue-700 text-white font-bold px-6 py-3 rounded-lg hover:bg-blue-800 transition-colors">Learn More</button></div></div></div></section>',
          category: 'CTA'
        }
      ]
    },
    {
      name: 'Footer',
      expanded: false,
      items: [
        {
          name: 'Simple Footer',
          icon: 'maximize',
          html: '<footer data-dcat-map="" class="bg-gray-900 text-white py-8"><div class="container mx-auto px-4"><div class="flex flex-col md:flex-row justify-between items-center"><div class="mb-4 md:mb-0"><span class="text-xl font-bold">BrandName</span></div><div class="flex space-x-6"><a href="#" class="hover:text-blue-400">Home</a><a href="#" class="hover:text-blue-400">About</a><a href="#" class="hover:text-blue-400">Services</a><a href="#" class="hover:text-blue-400">Contact</a></div></div><div class="mt-8 text-center text-gray-500 text-sm">© 2024 BrandName. All rights reserved.</div></div></footer>',
          category: 'Footer'
        }
      ]
    },
    {
      name: 'Pricing',
      expanded: false,
      items: [
        {
          name: '3 Tier Pricing',
          icon: 'request_quote',
          html: '<section data-dcat-map="" class="py-20 bg-gray-50 dark:bg-gray-900"><div class="container mx-auto px-4"><div class="text-center max-w-3xl mx-auto mb-16"><h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">Simple, transparent pricing</h2><p class="text-lg text-gray-600 dark:text-gray-400">No hidden fees. No surprise charges. Choose the plan that best fits your needs.</p></div><div class="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto"><div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 flex flex-col"><h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Starter</h3><p class="text-gray-500 dark:text-gray-400 mb-6">Perfect for individuals and small projects.</p><div class="mb-6"><span class="text-4xl font-extrabold text-gray-900 dark:text-white">$15</span><span class="text-gray-500 dark:text-gray-400">/month</span></div><ul class="space-y-4 mb-8 flex-1"><li class="flex items-center text-gray-600 dark:text-gray-300"><mat-icon class="text-green-500 mr-2 text-sm">check</mat-icon> Up to 5 projects</li><li class="flex items-center text-gray-600 dark:text-gray-300"><mat-icon class="text-green-500 mr-2 text-sm">check</mat-icon> Basic analytics</li><li class="flex items-center text-gray-600 dark:text-gray-300"><mat-icon class="text-green-500 mr-2 text-sm">check</mat-icon> 24-hour support response time</li></ul><button class="w-full bg-blue-50 text-blue-600 dark:bg-gray-700 dark:text-white hover:bg-blue-100 dark:hover:bg-gray-600 font-semibold py-3 px-4 rounded-lg transition-colors">Get Started</button></div><div class="bg-blue-600 rounded-2xl shadow-xl p-8 flex flex-col transform md:-translate-y-4 relative"><div class="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wide">Most Popular</div><h3 class="text-xl font-semibold text-white mb-2">Professional</h3><p class="text-blue-100 mb-6">Ideal for growing teams and businesses.</p><div class="mb-6"><span class="text-4xl font-extrabold text-white">$49</span><span class="text-blue-200">/month</span></div><ul class="space-y-4 mb-8 flex-1"><li class="flex items-center text-white"><mat-icon class="text-blue-200 mr-2 text-sm">check</mat-icon> Unlimited projects</li><li class="flex items-center text-white"><mat-icon class="text-blue-200 mr-2 text-sm">check</mat-icon> Advanced analytics</li><li class="flex items-center text-white"><mat-icon class="text-blue-200 mr-2 text-sm">check</mat-icon> 1-hour support response time</li><li class="flex items-center text-white"><mat-icon class="text-blue-200 mr-2 text-sm">check</mat-icon> Custom domains</li></ul><button class="w-full bg-white text-blue-600 hover:bg-gray-50 font-bold py-3 px-4 rounded-lg transition-colors shadow-md">Start Free Trial</button></div><div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 flex flex-col"><h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Enterprise</h3><p class="text-gray-500 dark:text-gray-400 mb-6">For large scale organizations with advanced needs.</p><div class="mb-6"><span class="text-4xl font-extrabold text-gray-900 dark:text-white">$199</span><span class="text-gray-500 dark:text-gray-400">/month</span></div><ul class="space-y-4 mb-8 flex-1"><li class="flex items-center text-gray-600 dark:text-gray-300"><mat-icon class="text-green-500 mr-2 text-sm">check</mat-icon> Everything in Professional</li><li class="flex items-center text-gray-600 dark:text-gray-300"><mat-icon class="text-green-500 mr-2 text-sm">check</mat-icon> Dedicated account manager</li><li class="flex items-center text-gray-600 dark:text-gray-300"><mat-icon class="text-green-500 mr-2 text-sm">check</mat-icon> Custom integrations</li><li class="flex items-center text-gray-600 dark:text-gray-300"><mat-icon class="text-green-500 mr-2 text-sm">check</mat-icon> SLA guarantee</li></ul><button class="w-full bg-blue-50 text-blue-600 dark:bg-gray-700 dark:text-white hover:bg-blue-100 dark:hover:bg-gray-600 font-semibold py-3 px-4 rounded-lg transition-colors">Contact Sales</button></div></div></div></section>',
          category: 'Pricing'
        }
      ]
    },
    {
      name: 'Testimonials',
      expanded: false,
      items: [
        {
          name: 'Testimonial Grid',
          icon: 'format_quote',
          html: '<section data-dcat-map="" class="py-20 bg-white dark:bg-gray-900"><div class="container mx-auto px-4"><h2 class="text-3xl font-bold text-center text-gray-900 dark:text-white mb-16">Loved by businesses worldwide</h2><div class="grid md:grid-cols-3 gap-8"><div class="bg-gray-50 dark:bg-gray-800 p-8 rounded-2xl"><div class="flex text-yellow-400 mb-4"><mat-icon class="text-sm">star</mat-icon><mat-icon class="text-sm">star</mat-icon><mat-icon class="text-sm">star</mat-icon><mat-icon class="text-sm">star</mat-icon><mat-icon class="text-sm">star</mat-icon></div><p class="text-gray-700 dark:text-gray-300 mb-6">"This platform has completely transformed how our team operates. We\'re shipping features 3x faster than before."</p><div class="flex items-center"><img src="https://i.pravatar.cc/150?img=1" alt="User" class="w-12 h-12 rounded-full mr-4"><div class="flex flex-col"><span class="font-bold text-gray-900 dark:text-white">Sarah Jenkins</span><span class="text-sm text-gray-500">CTO at TechCorp</span></div></div></div><div class="bg-gray-50 dark:bg-gray-800 p-8 rounded-2xl"><div class="flex text-yellow-400 mb-4"><mat-icon class="text-sm">star</mat-icon><mat-icon class="text-sm">star</mat-icon><mat-icon class="text-sm">star</mat-icon><mat-icon class="text-sm">star</mat-icon><mat-icon class="text-sm">star</mat-icon></div><p class="text-gray-700 dark:text-gray-300 mb-6">"The intuitive interface and powerful features make it a breeze to use. Highly recommended for any growing business."</p><div class="flex items-center"><img src="https://i.pravatar.cc/150?img=2" alt="User" class="w-12 h-12 rounded-full mr-4"><div class="flex flex-col"><span class="font-bold text-gray-900 dark:text-white">Michael Chen</span><span class="text-sm text-gray-500">Product Manager</span></div></div></div><div class="bg-gray-50 dark:bg-gray-800 p-8 rounded-2xl"><div class="flex text-yellow-400 mb-4"><mat-icon class="text-sm">star</mat-icon><mat-icon class="text-sm">star</mat-icon><mat-icon class="text-sm">star</mat-icon><mat-icon class="text-sm">star</mat-icon><mat-icon class="text-sm">star</mat-icon></div><p class="text-gray-700 dark:text-gray-300 mb-6">"Customer support is top-notch. They helped us migrate our entire infrastructure without any downtime."</p><div class="flex items-center"><img src="https://i.pravatar.cc/150?img=3" alt="User" class="w-12 h-12 rounded-full mr-4"><div class="flex flex-col"><span class="font-bold text-gray-900 dark:text-white">Emily Rodriguez</span><span class="text-sm text-gray-500">Operations Director</span></div></div></div></div></div></section>',
          category: 'Testimonials'
        }
      ]
    },
    {
      name: 'FAQ',
      expanded: false,
      items: [
        {
          name: 'FAQ List',
          icon: 'help_outline',
          html: '<section data-dcat-map="" class="py-20 bg-gray-50 dark:bg-gray-800"><div class="container mx-auto px-4 max-w-4xl"><div class="text-center mb-16"><h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">Frequently Asked Questions</h2><p class="text-lg text-gray-600 dark:text-gray-400">Can\'t find the answer you\'re looking for? Reach out to our customer support team.</p></div><div class="space-y-6"><div class="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm"><h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">What is your refund policy?</h3><p class="text-gray-600 dark:text-gray-400">If you\'re unhappy with your purchase for any reason, email us within 90 days and we\'ll refund you in full, no questions asked.</p></div><div class="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm"><h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">Do you offer technical support?</h3><p class="text-gray-600 dark:text-gray-400">Yes, we offer email support for all customers. Priority support is available for Professional and Enterprise plans.</p></div><div class="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm"><h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">Can I upgrade my plan later?</h3><p class="text-gray-600 dark:text-gray-400">Absolutely. You can upgrade or downgrade your plan at any time from your account dashboard. Prorated charges will be applied automatically.</p></div></div></div></section>',
          category: 'FAQ'
        }
      ]
    }
  ];

  loadPage(id: string) {
    console.log("Loading: ", id)
    const content = this.pageService.loadPage(id);
    if (content) {
      this.builderService.updateContent(content);
    }
  }

  deletePage(event: Event, id: string) {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this page?')) {
      this.pageService.deletePage(id);
      // If we deleted the current page, clear the canvas or load another one
      if (this.pageService.currentPageId() === null) {
        this.builderService.updateContent('<div class="p-8 text-center text-gray-400">Select or create a page</div>');
      }
    }
  }

  toggleCategory(name: string) {
    const category = this.categories.find(c => c.name === name);
    if (category) {
      category.expanded = !category.expanded;
    }
  }

  toggleSection(name: string) {
    const section = this.sections.find(s => s.name === name);
    if (section) {
      section.expanded = !section.expanded;
    }
  }

  setActiveTab(tab: 'components' | 'sections' | 'properties' | 'navigator') {
    this.activeTab = tab;
  }

  onAttachClick(event: Event, pageId: string) {
    event.stopPropagation();
    this.requestAttachFile.emit(pageId);
  }

  //
  onEditTemplate(template: any) {
    this.requestEditTemplate.emit(template);
  }
}
