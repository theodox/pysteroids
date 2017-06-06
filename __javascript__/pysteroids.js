"use strict";
// Transcrypt'ed from Python, 2017-06-06 00:26:02
function pysteroids () {
   var __symbols__ = ['__py3.6__', '__esv6__'];
    var __all__ = {};
    var __world__ = __all__;
    
    // Nested object creator, part of the nesting may already exist and have attributes
    var __nest__ = function (headObject, tailNames, value) {
        // In some cases this will be a global object, e.g. 'window'
        var current = headObject;
        
        if (tailNames != '') {  // Split on empty string doesn't give empty list
            // Find the last already created object in tailNames
            var tailChain = tailNames.split ('.');
            var firstNewIndex = tailChain.length;
            for (var index = 0; index < tailChain.length; index++) {
                if (!current.hasOwnProperty (tailChain [index])) {
                    firstNewIndex = index;
                    break;
                }
                current = current [tailChain [index]];
            }
            
            // Create the rest of the objects, if any
            for (var index = firstNewIndex; index < tailChain.length; index++) {
                current [tailChain [index]] = {};
                current = current [tailChain [index]];
            }
        }
        
        // Insert it new attributes, it may have been created earlier and have other attributes
        for (var attrib in value) {
            current [attrib] = value [attrib];          
        }       
    };
    __all__.__nest__ = __nest__;
    
    // Initialize module if not yet done and return its globals
    var __init__ = function (module) {
        if (!module.__inited__) {
            module.__all__.__init__ (module.__all__);
            module.__inited__ = true;
        }
        return module.__all__;
    };
    __all__.__init__ = __init__;
    
    
    // Proxy switch, controlled by __pragma__ ('proxy') and __pragma ('noproxy')
    var __proxy__ = false;  // No use assigning it to __all__, only its transient state is important
    
    
    // Since we want to assign functions, a = b.f should make b.f produce a bound function
    // So __get__ should be called by a property rather then a function
    // Factory __get__ creates one of three curried functions for func
    // Which one is produced depends on what's to the left of the dot of the corresponding JavaScript property
    var __get__ = function (self, func, quotedFuncName) {
        if (self) {
            if (self.hasOwnProperty ('__class__') || typeof self == 'string' || self instanceof String) {           // Object before the dot
                if (quotedFuncName) {                                   // Memoize call since fcall is on, by installing bound function in instance
                    Object.defineProperty (self, quotedFuncName, {      // Will override the non-own property, next time it will be called directly
                        value: function () {                            // So next time just call curry function that calls function
                            var args = [] .slice.apply (arguments);
                            return func.apply (null, [self] .concat (args));
                        },              
                        writable: true,
                        enumerable: true,
                        configurable: true
                    });
                }
                return function () {                                    // Return bound function, code dupplication for efficiency if no memoizing
                    var args = [] .slice.apply (arguments);             // So multilayer search prototype, apply __get__, call curry func that calls func
                    return func.apply (null, [self] .concat (args));
                };
            }
            else {                                                      // Class before the dot
                return func;                                            // Return static method
            }
        }
        else {                                                          // Nothing before the dot
            return func;                                                // Return free function
        }
    }
    __all__.__get__ = __get__;
        
    // Mother of all metaclasses        
    var py_metatype = {
        __name__: 'type',
        __bases__: [],
        
        // Overridable class creation worker
        __new__: function (meta, name, bases, attribs) {
            // Create the class cls, a functor, which the class creator function will return
            var cls = function () {                     // If cls is called with arg0, arg1, etc, it calls its __new__ method with [arg0, arg1, etc]
                var args = [] .slice.apply (arguments); // It has a __new__ method, not yet but at call time, since it is copied from the parent in the loop below
                return cls.__new__ (args);              // Each Python class directly or indirectly derives from object, which has the __new__ method
            };                                          // If there are no bases in the Python source, the compiler generates [object] for this parameter
            
            // Copy all methods, including __new__, properties and static attributes from base classes to new cls object
            // The new class object will simply be the prototype of its instances
            // JavaScript prototypical single inheritance will do here, since any object has only one class
            // This has nothing to do with Python multiple inheritance, that is implemented explictly in the copy loop below
            for (var index = bases.length - 1; index >= 0; index--) {   // Reversed order, since class vars of first base should win
                var base = bases [index];
                for (var attrib in base) {
                    var descrip = Object.getOwnPropertyDescriptor (base, attrib);
                    Object.defineProperty (cls, attrib, descrip);
                }           

                for (var symbol of Object.getOwnPropertySymbols (base)) {
                    var descrip = Object.getOwnPropertyDescriptor (base, symbol);
                    Object.defineProperty (cls, symbol, descrip);
                }
                
            }
            
            // Add class specific attributes to the created cls object
            cls.__metaclass__ = meta;
            cls.__name__ = name;
            cls.__bases__ = bases;
            
            // Add own methods, properties and own static attributes to the created cls object
            for (var attrib in attribs) {
                var descrip = Object.getOwnPropertyDescriptor (attribs, attrib);
                Object.defineProperty (cls, attrib, descrip);
            }

            for (var symbol of Object.getOwnPropertySymbols (attribs)) {
                var descrip = Object.getOwnPropertyDescriptor (attribs, symbol);
                Object.defineProperty (cls, symbol, descrip);
            }
            
            // Return created cls object
            return cls;
        }
    };
    py_metatype.__metaclass__ = py_metatype;
    __all__.py_metatype = py_metatype;
    
    // Mother of all classes
    var object = {
        __init__: function (self) {},
        
        __metaclass__: py_metatype, // By default, all classes have metaclass type, since they derive from object
        __name__: 'object',
        __bases__: [],
            
        // Object creator function, is inherited by all classes (so could be global)
        __new__: function (args) {  // Args are just the constructor args       
            // In JavaScript the Python class is the prototype of the Python object
            // In this way methods and static attributes will be available both with a class and an object before the dot
            // The descriptor produced by __get__ will return the right method flavor
            var instance = Object.create (this, {__class__: {value: this, enumerable: true}});
            
        if ('__getattr__' in this || '__setattr__' in this) {
            instance = new Proxy (instance, {
                get: function (target, name) {
                    var result = target [name];
                    if (result == undefined) {  // Target doesn't have attribute named name
                        return target.__getattr__ (name);
                    }
                    else {
                        return result;
                    }
                },
                set: function (target, name, value) {
                    try {
                        target.__setattr__ (name, value);
                    }
                    catch (exception) {         // Target doesn't have a __setattr__ method
                        target [name] = value;
                    }
                    return true;
                }
            })
        }

            // Call constructor
            this.__init__.apply (null, [instance] .concat (args));

            // Return constructed instance
            return instance;
        }   
    };
    __all__.object = object;
    
    // Class creator facade function, calls class creation worker
    var __class__ = function (name, bases, attribs, meta) {         // Parameter meta is optional
        if (meta == undefined) {
            meta = bases [0] .__metaclass__;
        }
                
        return meta.__new__ (meta, name, bases, attribs);
    }
    __all__.__class__ = __class__;
    
    // Define __pragma__ to preserve '<all>' and '</all>', since it's never generated as a function, must be done early, so here
    var __pragma__ = function () {};
    __all__.__pragma__ = __pragma__;
    
    	__nest__ (
		__all__,
		'org.transcrypt.__base__', {
			__all__: {
				__inited__: false,
				__init__: function (__all__) {
					var __Envir__ = __class__ ('__Envir__', [object], {
						get __init__ () {return __get__ (this, function (self) {
							self.interpreter_name = 'python';
							self.transpiler_name = 'transcrypt';
							self.transpiler_version = '3.6.25';
							self.target_subdir = '__javascript__';
						});}
					});
					var __envir__ = __Envir__ ();
					__pragma__ ('<all>')
						__all__.__Envir__ = __Envir__;
						__all__.__envir__ = __envir__;
					__pragma__ ('</all>')
				}
			}
		}
	);
	__nest__ (
		__all__,
		'org.transcrypt.__standard__', {
			__all__: {
				__inited__: false,
				__init__: function (__all__) {
					var Exception = __class__ ('Exception', [object], {
						get __init__ () {return __get__ (this, function (self) {
							var kwargs = dict ();
							if (arguments.length) {
								var __ilastarg0__ = arguments.length - 1;
								if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
									var __allkwargs0__ = arguments [__ilastarg0__--];
									for (var __attrib0__ in __allkwargs0__) {
										switch (__attrib0__) {
											case 'self': var self = __allkwargs0__ [__attrib0__]; break;
											default: kwargs [__attrib0__] = __allkwargs0__ [__attrib0__];
										}
									}
									delete kwargs.__kwargtrans__;
								}
								var args = tuple ([].slice.apply (arguments).slice (1, __ilastarg0__ + 1));
							}
							else {
								var args = tuple ();
							}
							self.__args__ = args;
							try {
								self.stack = kwargs.error.stack;
							}
							catch (__except0__) {
								self.stack = 'No stack trace available';
							}
						});},
						get __repr__ () {return __get__ (this, function (self) {
							if (len (self.__args__)) {
								return '{}{}'.format (self.__class__.__name__, repr (tuple (self.__args__)));
							}
							else {
								return '{}()'.format (self.__class__.__name__);
							}
						});},
						get __str__ () {return __get__ (this, function (self) {
							if (len (self.__args__) > 1) {
								return str (tuple (self.__args__));
							}
							else if (len (self.__args__)) {
								return str (self.__args__ [0]);
							}
							else {
								return '';
							}
						});}
					});
					var IterableError = __class__ ('IterableError', [Exception], {
						get __init__ () {return __get__ (this, function (self, error) {
							Exception.__init__ (self, "Can't iterate over non-iterable", __kwargtrans__ ({error: error}));
						});}
					});
					var StopIteration = __class__ ('StopIteration', [Exception], {
						get __init__ () {return __get__ (this, function (self, error) {
							Exception.__init__ (self, 'Iterator exhausted', __kwargtrans__ ({error: error}));
						});}
					});
					var ValueError = __class__ ('ValueError', [Exception], {
						get __init__ () {return __get__ (this, function (self, error) {
							Exception.__init__ (self, 'Erroneous value', __kwargtrans__ ({error: error}));
						});}
					});
					var KeyError = __class__ ('KeyError', [Exception], {
						get __init__ () {return __get__ (this, function (self, error) {
							Exception.__init__ (self, 'Invalid key', __kwargtrans__ ({error: error}));
						});}
					});
					var AssertionError = __class__ ('AssertionError', [Exception], {
						get __init__ () {return __get__ (this, function (self, message, error) {
							if (message) {
								Exception.__init__ (self, message, __kwargtrans__ ({error: error}));
							}
							else {
								Exception.__init__ (self, __kwargtrans__ ({error: error}));
							}
						});}
					});
					var NotImplementedError = __class__ ('NotImplementedError', [Exception], {
						get __init__ () {return __get__ (this, function (self, message, error) {
							Exception.__init__ (self, message, __kwargtrans__ ({error: error}));
						});}
					});
					var IndexError = __class__ ('IndexError', [Exception], {
						get __init__ () {return __get__ (this, function (self, message, error) {
							Exception.__init__ (self, message, __kwargtrans__ ({error: error}));
						});}
					});
					var AttributeError = __class__ ('AttributeError', [Exception], {
						get __init__ () {return __get__ (this, function (self, message, error) {
							Exception.__init__ (self, message, __kwargtrans__ ({error: error}));
						});}
					});
					var Warning = __class__ ('Warning', [Exception], {
					});
					var UserWarning = __class__ ('UserWarning', [Warning], {
					});
					var DeprecationWarning = __class__ ('DeprecationWarning', [Warning], {
					});
					var RuntimeWarning = __class__ ('RuntimeWarning', [Warning], {
					});
					var __sort__ = function (iterable, key, reverse) {
						if (typeof key == 'undefined' || (key != null && key .hasOwnProperty ("__kwargtrans__"))) {;
							var key = null;
						};
						if (typeof reverse == 'undefined' || (reverse != null && reverse .hasOwnProperty ("__kwargtrans__"))) {;
							var reverse = false;
						};
						if (arguments.length) {
							var __ilastarg0__ = arguments.length - 1;
							if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
								var __allkwargs0__ = arguments [__ilastarg0__--];
								for (var __attrib0__ in __allkwargs0__) {
									switch (__attrib0__) {
										case 'iterable': var iterable = __allkwargs0__ [__attrib0__]; break;
										case 'key': var key = __allkwargs0__ [__attrib0__]; break;
										case 'reverse': var reverse = __allkwargs0__ [__attrib0__]; break;
									}
								}
							}
						}
						else {
						}
						if (key) {
							iterable.sort ((function __lambda__ (a, b) {
								if (arguments.length) {
									var __ilastarg0__ = arguments.length - 1;
									if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
										var __allkwargs0__ = arguments [__ilastarg0__--];
										for (var __attrib0__ in __allkwargs0__) {
											switch (__attrib0__) {
												case 'a': var a = __allkwargs0__ [__attrib0__]; break;
												case 'b': var b = __allkwargs0__ [__attrib0__]; break;
											}
										}
									}
								}
								else {
								}
								return (key (a) > key (b) ? 1 : -(1));
							}));
						}
						else {
							iterable.sort ();
						}
						if (reverse) {
							iterable.reverse ();
						}
					};
					var sorted = function (iterable, key, reverse) {
						if (typeof key == 'undefined' || (key != null && key .hasOwnProperty ("__kwargtrans__"))) {;
							var key = null;
						};
						if (typeof reverse == 'undefined' || (reverse != null && reverse .hasOwnProperty ("__kwargtrans__"))) {;
							var reverse = false;
						};
						if (arguments.length) {
							var __ilastarg0__ = arguments.length - 1;
							if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
								var __allkwargs0__ = arguments [__ilastarg0__--];
								for (var __attrib0__ in __allkwargs0__) {
									switch (__attrib0__) {
										case 'iterable': var iterable = __allkwargs0__ [__attrib0__]; break;
										case 'key': var key = __allkwargs0__ [__attrib0__]; break;
										case 'reverse': var reverse = __allkwargs0__ [__attrib0__]; break;
									}
								}
							}
						}
						else {
						}
						if (py_typeof (iterable) == dict) {
							var result = copy (iterable.py_keys ());
						}
						else {
							var result = copy (iterable);
						}
						__sort__ (result, key, reverse);
						return result;
					};
					var map = function (func, iterable) {
						return function () {
							var __accu0__ = [];
							for (var item of iterable) {
								__accu0__.append (func (item));
							}
							return __accu0__;
						} ();
					};
					var filter = function (func, iterable) {
						if (func == null) {
							var func = bool;
						}
						return function () {
							var __accu0__ = [];
							for (var item of iterable) {
								if (func (item)) {
									__accu0__.append (item);
								}
							}
							return __accu0__;
						} ();
					};
					var __Terminal__ = __class__ ('__Terminal__', [object], {
						get __init__ () {return __get__ (this, function (self) {
							self.buffer = '';
							try {
								self.element = document.getElementById ('__terminal__');
							}
							catch (__except0__) {
								self.element = null;
							}
							if (self.element) {
								self.element.style.overflowX = 'auto';
								self.element.style.boxSizing = 'border-box';
								self.element.style.padding = '5px';
								self.element.innerHTML = '_';
							}
						});},
						get print () {return __get__ (this, function (self) {
							var sep = ' ';
							var end = '\n';
							if (arguments.length) {
								var __ilastarg0__ = arguments.length - 1;
								if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
									var __allkwargs0__ = arguments [__ilastarg0__--];
									for (var __attrib0__ in __allkwargs0__) {
										switch (__attrib0__) {
											case 'self': var self = __allkwargs0__ [__attrib0__]; break;
											case 'sep': var sep = __allkwargs0__ [__attrib0__]; break;
											case 'end': var end = __allkwargs0__ [__attrib0__]; break;
										}
									}
								}
								var args = tuple ([].slice.apply (arguments).slice (1, __ilastarg0__ + 1));
							}
							else {
								var args = tuple ();
							}
							self.buffer = '{}{}{}'.format (self.buffer, sep.join (function () {
								var __accu0__ = [];
								for (var arg of args) {
									__accu0__.append (str (arg));
								}
								return __accu0__;
							} ()), end).__getslice__ (-(4096), null, 1);
							if (self.element) {
								self.element.innerHTML = self.buffer.py_replace ('\n', '<br>');
								self.element.scrollTop = self.element.scrollHeight;
							}
							else {
								console.log (sep.join (function () {
									var __accu0__ = [];
									for (var arg of args) {
										__accu0__.append (str (arg));
									}
									return __accu0__;
								} ()));
							}
						});},
						get input () {return __get__ (this, function (self, question) {
							if (arguments.length) {
								var __ilastarg0__ = arguments.length - 1;
								if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
									var __allkwargs0__ = arguments [__ilastarg0__--];
									for (var __attrib0__ in __allkwargs0__) {
										switch (__attrib0__) {
											case 'self': var self = __allkwargs0__ [__attrib0__]; break;
											case 'question': var question = __allkwargs0__ [__attrib0__]; break;
										}
									}
								}
							}
							else {
							}
							self.print ('{}'.format (question), __kwargtrans__ ({end: ''}));
							var answer = window.prompt ('\n'.join (self.buffer.py_split ('\n').__getslice__ (-(16), null, 1)));
							self.print (answer);
							return answer;
						});}
					});
					var __terminal__ = __Terminal__ ();
					__pragma__ ('<all>')
						__all__.AssertionError = AssertionError;
						__all__.AttributeError = AttributeError;
						__all__.DeprecationWarning = DeprecationWarning;
						__all__.Exception = Exception;
						__all__.IndexError = IndexError;
						__all__.IterableError = IterableError;
						__all__.KeyError = KeyError;
						__all__.NotImplementedError = NotImplementedError;
						__all__.RuntimeWarning = RuntimeWarning;
						__all__.StopIteration = StopIteration;
						__all__.UserWarning = UserWarning;
						__all__.ValueError = ValueError;
						__all__.Warning = Warning;
						__all__.__Terminal__ = __Terminal__;
						__all__.__sort__ = __sort__;
						__all__.__terminal__ = __terminal__;
						__all__.filter = filter;
						__all__.map = map;
						__all__.sorted = sorted;
					__pragma__ ('</all>')
				}
			}
		}
	);
    var __call__ = function (/* <callee>, <this>, <params>* */) {   // Needed for __base__ and __standard__ if global 'opov' switch is on
        var args = [] .slice.apply (arguments);
        if (typeof args [0] == 'object' && '__call__' in args [0]) {        // Overloaded
            return args [0] .__call__ .apply (args [1], args.slice (2));
        }
        else {                                                              // Native
            return args [0] .apply (args [1], args.slice (2));
        }
    };
    __all__.__call__ = __call__;

    // Initialize non-nested modules __base__ and __standard__ and make its names available directly and via __all__
    // They can't do that itself, because they're regular Python modules
    // The compiler recognizes their names and generates them inline rather than nesting them
    // In this way it isn't needed to import them everywhere

    // __base__

    __nest__ (__all__, '', __init__ (__all__.org.transcrypt.__base__));
    var __envir__ = __all__.__envir__;

    // __standard__

    __nest__ (__all__, '', __init__ (__all__.org.transcrypt.__standard__));

    var Exception = __all__.Exception;
    var IterableError = __all__.IterableError;
    var StopIteration = __all__.StopIteration;
    var ValueError = __all__.ValueError;
    var KeyError = __all__.KeyError;
    var AssertionError = __all__.AssertionError;
    var NotImplementedError = __all__.NotImplementedError;
    var IndexError = __all__.IndexError;
    var AttributeError = __all__.AttributeError;

    // Warnings Exceptions
    var Warning = __all__.Warning;
    var UserWarning = __all__.UserWarning;
    var DeprecationWarning = __all__.DeprecationWarning;
    var RuntimeWarning = __all__.RuntimeWarning;

    var __sort__ = __all__.__sort__;
    var sorted = __all__.sorted;

    var map = __all__.map;
    var filter = __all__.filter;

    __all__.print = __all__.__terminal__.print;
    __all__.input = __all__.__terminal__.input;

    var __terminal__ = __all__.__terminal__;
    var print = __all__.print;
    var input = __all__.input;

    // Complete __envir__, that was created in __base__, for non-stub mode
    __envir__.executor_name = __envir__.transpiler_name;

    // Make make __main__ available in browser
    var __main__ = {__file__: ''};
    __all__.main = __main__;

    // Define current exception, there's at most one exception in the air at any time
    var __except__ = null;
    __all__.__except__ = __except__;
    
     // Creator of a marked dictionary, used to pass **kwargs parameter
    var __kwargtrans__ = function (anObject) {
        anObject.__kwargtrans__ = null; // Removable marker
        anObject.constructor = Object;
        return anObject;
    }
    __all__.__kwargtrans__ = __kwargtrans__;

    // 'Oneshot' dict promotor, used to enrich __all__ and help globals () return a true dict
    var __globals__ = function (anObject) {
        if (isinstance (anObject, dict)) {  // Don't attempt to promote (enrich) again, since it will make a copy
            return anObject;
        }
        else {
            return dict (anObject)
        }
    }
    __all__.__globals__ = __globals__
    
    // Partial implementation of super () .<methodName> (<params>)
    var __super__ = function (aClass, methodName) {        
        // Lean and fast, no C3 linearization, only call first implementation encountered
        // Will allow __super__ ('<methodName>') (self, <params>) rather than only <className>.<methodName> (self, <params>)
        
        for (let base of aClass.__bases__) {
            if (methodName in base) {
               return base [methodName];
            }
        }

        throw new Exception ('Superclass method not found');    // !!! Improve!
    }
    __all__.__super__ = __super__
        
    // Python property installer function, no member since that would bloat classes
    var property = function (getter, setter) {  // Returns a property descriptor rather than a property
        if (!setter) {  // ??? Make setter optional instead of dummy?
            setter = function () {};
        }
        return {get: function () {return getter (this)}, set: function (value) {setter (this, value)}, enumerable: true};
    }
    __all__.property = property;
    
    // Conditional JavaScript property installer function, prevents redefinition of properties if multiple Transcrypt apps are on one page
    var __setProperty__ = function (anObject, name, descriptor) {
        if (!anObject.hasOwnProperty (name)) {
            Object.defineProperty (anObject, name, descriptor);
        }
    }
    __all__.__setProperty__ = __setProperty__
    
    // Assert function, call to it only generated when compiling with --dassert option
    function assert (condition, message) {  // Message may be undefined
        if (!condition) {
            throw AssertionError (message, new Error ());
        }
    }

    __all__.assert = assert;

    var __merge__ = function (object0, object1) {
        var result = {};
        for (var attrib in object0) {
            result [attrib] = object0 [attrib];
        }
        for (var attrib in object1) {
            result [attrib] = object1 [attrib];
        }
        return result;
    };
    __all__.__merge__ = __merge__;

    // Manipulating attributes by name
    
    var dir = function (obj) {
        var aList = [];
        for (var aKey in obj) {
            aList.push (aKey);
        }
        aList.sort ();
        return aList;
    };
    __all__.dir = dir;

    var setattr = function (obj, name, value) {
        obj [name] = value;
    };
    __all__.setattr = setattr;

    var getattr = function (obj, name) {
        return obj [name];
    };
    __all__.getattr= getattr;

    var hasattr = function (obj, name) {
        try {
            return name in obj;
        }
        catch (exception) {
            return false;
        }
    };
    __all__.hasattr = hasattr;

    var delattr = function (obj, name) {
        delete obj [name];
    };
    __all__.delattr = (delattr);

    // The __in__ function, used to mimic Python's 'in' operator
    // In addition to CPython's semantics, the 'in' operator is also allowed to work on objects, avoiding a counterintuitive separation between Python dicts and JavaScript objects
    // In general many Transcrypt compound types feature a deliberate blend of Python and JavaScript facilities, facilitating efficient integration with JavaScript libraries
    // If only Python objects and Python dicts are dealt with in a certain context, the more pythonic 'hasattr' is preferred for the objects as opposed to 'in' for the dicts
    var __in__ = function (element, container) {
        if (py_typeof (container) == dict) {        // Currently only implemented as an augmented JavaScript object
            return container.hasOwnProperty (element);
        }
        else {                                      // Parameter 'element' itself is an array, string or a plain, non-dict JavaScript object
            return (
                container.indexOf ?                 // If it has an indexOf
                container.indexOf (element) > -1 :  // it's an array or a string,
                container.hasOwnProperty (element)  // else it's a plain, non-dict JavaScript object
            );
        }
    };
    __all__.__in__ = __in__;

    // Find out if an attribute is special
    var __specialattrib__ = function (attrib) {
        return (attrib.startswith ('__') && attrib.endswith ('__')) || attrib == 'constructor' || attrib.startswith ('py_');
    };
    __all__.__specialattrib__ = __specialattrib__;

    // Len function for any object
    var len = function (anObject) {
        if (anObject) {
            var l = anObject.length;
            if (l == undefined) {
                var result = 0;
                for (var attrib in anObject) {
                    if (!__specialattrib__ (attrib)) {
                        result++;
                    }
                }
                return result;
            }
            else {
                return l;
            }
        }
        else {
            return 0;
        }
    };
    __all__.len = len;

    // General conversions

    function __i__ (any) {  //  Conversion to iterable
        return py_typeof (any) == dict ? any.py_keys () : any;
    }

    function __t__ (any) {  // Conversion to truthyness, __ ([1, 2, 3]) returns [1, 2, 3], needed for nonempty selection: l = list1 or list2]
        return (['boolean', 'number'] .indexOf (typeof any) >= 0 || any instanceof Function || len (any)) ? any : false;
        // JavaScript functions have a length attribute, denoting the number of parameters
        // Python objects are JavaScript functions, but their length doesn't matter, only their existence
        // By the term 'any instanceof Function' we make sure that Python objects aren't rejected when their length equals zero
    }
    __all__.__t__ = __t__;

    var bool = function (any) {     // Always truly returns a bool, rather than something truthy or falsy
        return !!__t__ (any);
    };
    bool.__name__ = 'bool';         // So it can be used as a type with a name
    __all__.bool = bool;

    var float = function (any) {
        if (any == 'inf') {
            return Infinity;
        }
        else if (any == '-inf') {
            return -Infinity;
        }
        else if (isNaN (parseFloat (any))) {    // Call to parseFloat needed to exclude '', ' ' etc.
            throw ValueError (new Error ());
        }
        else {
            return +any;
        }
    };
    float.__name__ = 'float';
    __all__.float = float;

    var int = function (any) {
        return float (any) | 0
    };
    int.__name__ = 'int';
    __all__.int = int;

    var py_typeof = function (anObject) {
        var aType = typeof anObject;
        if (aType == 'object') {    // Directly trying '__class__ in anObject' turns out to wreck anObject in Chrome if its a primitive
            try {
                return anObject.__class__;
            }
            catch (exception) {
                return aType;
            }
        }
        else {
            return (    // Odly, the braces are required here
                aType == 'boolean' ? bool :
                aType == 'string' ? str :
                aType == 'number' ? (anObject % 1 == 0 ? int : float) :
                null
            );
        }
    };
    __all__.py_typeof = py_typeof;

    var isinstance = function (anObject, classinfo) {
        function isA (queryClass) {
            if (queryClass == classinfo) {
                return true;
            }
            for (var index = 0; index < queryClass.__bases__.length; index++) {
                if (isA (queryClass.__bases__ [index], classinfo)) {
                    return true;
                }
            }
            return false;
        }

        if (classinfo instanceof Array) {   // Assume in most cases it isn't, then making it recursive rather than two functions saves a call
            for (let aClass of classinfo) {
                if (isinstance (anObject, aClass)) {
                    return true;
                }
            }
            return false;
        }

        try {                   // Most frequent use case first
            return '__class__' in anObject ? isA (anObject.__class__) : anObject instanceof classinfo;
        }
        catch (exception) {     // Using isinstance on primitives assumed rare
            var aType = py_typeof (anObject);
            return aType == classinfo || (aType == bool && classinfo == int);
        }
    };
    __all__.isinstance = isinstance;

    var callable = function (anObject) {
        if ( typeof anObject == 'object' && '__call__' in anObject ) {
            return true;
        }
        else {
            return typeof anObject === 'function';
        }
    };
    __all__.callable = callable;

    // Repr function uses __repr__ method, then __str__, then toString
    var repr = function (anObject) {
        try {
            return anObject.__repr__ ();
        }
        catch (exception) {
            try {
                return anObject.__str__ ();
            }
            catch (exception) { // anObject has no __repr__ and no __str__
                try {
                    if (anObject == null) {
                        return 'None';
                    }
                    else if (anObject.constructor == Object) {
                        var result = '{';
                        var comma = false;
                        for (var attrib in anObject) {
                            if (!__specialattrib__ (attrib)) {
                                if (attrib.isnumeric ()) {
                                    var attribRepr = attrib;                // If key can be interpreted as numerical, we make it numerical
                                }                                           // So we accept that '1' is misrepresented as 1
                                else {
                                    var attribRepr = '\'' + attrib + '\'';  // Alpha key in dict
                                }

                                if (comma) {
                                    result += ', ';
                                }
                                else {
                                    comma = true;
                                }
                                result += attribRepr + ': ' + repr (anObject [attrib]);
                            }
                        }
                        result += '}';
                        return result;
                    }
                    else {
                        return typeof anObject == 'boolean' ? anObject.toString () .capitalize () : anObject.toString ();
                    }
                }
                catch (exception) {
                    console.log ('ERROR: Could not evaluate repr (<object of type ' + typeof anObject + '>)');
                    console.log (exception);
                    return '???';
                }
            }
        }
    };
    __all__.repr = repr;

    // Char from Unicode or ASCII
    var chr = function (charCode) {
        return String.fromCharCode (charCode);
    };
    __all__.chr = chr;

    // Unicode or ASCII from char
    var ord = function (aChar) {
        return aChar.charCodeAt (0);
    };
    __all__.org = ord;

    // Maximum of n numbers
    var max = Math.max;
    __all__.max = max;

    // Minimum of n numbers
    var min = Math.min;
    __all__.min = min;

    // Absolute value
    var abs = Math.abs;
    __all__.abs = abs;

    // Bankers rounding
    var round = function (number, ndigits) {
        if (ndigits) {
            var scale = Math.pow (10, ndigits);
            number *= scale;
        }

        var rounded = Math.round (number);
        if (rounded - number == 0.5 && rounded % 2) {   // Has rounded up to odd, should have rounded down to even
            rounded -= 1;
        }

        if (ndigits) {
            rounded /= scale;
        }

        return rounded;
    };
    __all__.round = round;

    // BEGIN unified iterator model

    function __jsUsePyNext__ () {       // Add as 'next' method to make Python iterator JavaScript compatible
        try {
            var result = this.__next__ ();
            return {value: result, done: false};
        }
        catch (exception) {
            return {value: undefined, done: true};
        }
    }

    function __pyUseJsNext__ () {       // Add as '__next__' method to make JavaScript iterator Python compatible
        var result = this.next ();
        if (result.done) {
            throw StopIteration (new Error ());
        }
        else {
            return result.value;
        }
    }

    function py_iter (iterable) {                   // Alias for Python's iter function, produces a universal iterator / iterable, usable in Python and JavaScript
        if (typeof iterable == 'string' || '__iter__' in iterable) {    // JavaScript Array or string or Python iterable (string has no 'in')
            var result = iterable.__iter__ ();                          // Iterator has a __next__
            result.next = __jsUsePyNext__;                              // Give it a next
        }
        else if ('selector' in iterable) {                              // Assume it's a JQuery iterator
            var result = list (iterable) .__iter__ ();                  // Has a __next__
            result.next = __jsUsePyNext__;                              // Give it a next
        }
        else if ('next' in iterable) {                                  // It's a JavaScript iterator already,  maybe a generator, has a next and may have a __next__
            var result = iterable
            if (! ('__next__' in result)) {                             // If there's no danger of recursion
                result.__next__ = __pyUseJsNext__;                      // Give it a __next__
            }
        }
        else if (Symbol.iterator in iterable) {                         // It's a JavaScript iterable such as a typed array, but not an iterator
            var result = iterable [Symbol.iterator] ();                 // Has a next
            result.__next__ = __pyUseJsNext__;                          // Give it a __next__
        }
        else {
            throw IterableError (new Error ()); // No iterator at all
        }
        result [Symbol.iterator] = function () {return result;};
        return result;
    }

    function py_next (iterator) {               // Called only in a Python context, could receive Python or JavaScript iterator
        try {                                   // Primarily assume Python iterator, for max speed
            var result = iterator.__next__ ();
        }
        catch (exception) {                     // JavaScript iterators are the exception here
            var result = iterator.next ();
            if (result.done) {
                throw StopIteration (new Error ());
            }
            else {
                return result.value;
            }
        }
        if (result == undefined) {
            throw StopIteration (new Error ());
        }
        else {
            return result;
        }
    }

    function __PyIterator__ (iterable) {
        this.iterable = iterable;
        this.index = 0;
    }

    __PyIterator__.prototype.__next__ = function () {
        if (this.index < this.iterable.length) {
            return this.iterable [this.index++];
        }
        else {
            throw StopIteration (new Error ());
        }
    };

    function __JsIterator__ (iterable) {
        this.iterable = iterable;
        this.index = 0;
    }

    __JsIterator__.prototype.next = function () {
        if (this.index < this.iterable.py_keys.length) {
            return {value: this.index++, done: false};
        }
        else {
            return {value: undefined, done: true};
        }
    };

    // END unified iterator model

    // Reversed function for arrays
    var py_reversed = function (iterable) {
        iterable = iterable.slice ();
        iterable.reverse ();
        return iterable;
    };
    __all__.py_reversed = py_reversed;

    // Zip method for arrays and strings
    var zip = function () {
        var args = [] .slice.call (arguments);
        if (typeof args [0] == 'string') {
            for (var i = 0; i < args.length; i++) {
                args [i] = args [i] .split ('');
            }
        }
        var shortest = args.length == 0 ? [] : args.reduce (    // Find shortest array in arguments
            function (array0, array1) {
                return array0.length < array1.length ? array0 : array1;
            }
        );
        return shortest.map (                   // Map each element of shortest array
            function (current, index) {         // To the result of this function
                return args.map (               // Map each array in arguments
                    function (current) {        // To the result of this function
                        return current [index]; // Namely it's index't entry
                    }
                );
            }
        );
    };
    __all__.zip = zip;

    // Range method, returning an array
    function range (start, stop, step) {
        if (stop == undefined) {
            // one param defined
            stop = start;
            start = 0;
        }
        if (step == undefined) {
            step = 1;
        }
        if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
            return [];
        }
        var result = [];
        for (var i = start; step > 0 ? i < stop : i > stop; i += step) {
            result.push(i);
        }
        return result;
    };
    __all__.range = range;

    // Any, all and sum

    function any (iterable) {
        for (let item of iterable) {
            if (bool (item)) {
                return true;
            }
        }
        return false;
    }
    function all (iterable) {
        for (let item of iterable) {
            if (! bool (item)) {
                return false;
            }
        }
        return true;
    }
    function sum (iterable) {
        let result = 0;
        for (let item of iterable) {
            result += item;
        }
        return result;
    }

    __all__.any = any;
    __all__.all = all;
    __all__.sum = sum;

    // Enumerate method, returning a zipped list
    function enumerate (iterable) {
        return zip (range (len (iterable)), iterable);
    }
    __all__.enumerate = enumerate;

    // Shallow and deepcopy

    function copy (anObject) {
        if (anObject == null || typeof anObject == "object") {
            return anObject;
        }
        else {
            var result = {};
            for (var attrib in obj) {
                if (anObject.hasOwnProperty (attrib)) {
                    result [attrib] = anObject [attrib];
                }
            }
            return result;
        }
    }
    __all__.copy = copy;

    function deepcopy (anObject) {
        if (anObject == null || typeof anObject == "object") {
            return anObject;
        }
        else {
            var result = {};
            for (var attrib in obj) {
                if (anObject.hasOwnProperty (attrib)) {
                    result [attrib] = deepcopy (anObject [attrib]);
                }
            }
            return result;
        }
    }
    __all__.deepcopy = deepcopy;

    // List extensions to Array

    function list (iterable) {                                      // All such creators should be callable without new
        var instance = iterable ? Array.from (iterable) : [];
        // Sort is the normal JavaScript sort, Python sort is a non-member function
        return instance;
    }
    __all__.list = list;
    Array.prototype.__class__ = list;   // All arrays are lists (not only if constructed by the list ctor), unless constructed otherwise
    list.__name__ = 'list';

    /*
    Array.from = function (iterator) { // !!! remove
        result = [];
        for (item of iterator) {
            result.push (item);
        }
        return result;
    }
    */

    Array.prototype.__iter__ = function () {return new __PyIterator__ (this);};

    Array.prototype.__getslice__ = function (start, stop, step) {
        if (start < 0) {
            start = this.length + start;
        }

        if (stop == null) {
            stop = this.length;
        }
        else if (stop < 0) {
            stop = this.length + stop;
        }
        else if (stop > this.length) {
            stop = this.length;
        }

        var result = list ([]);
        for (var index = start; index < stop; index += step) {
            result.push (this [index]);
        }

        return result;
    };

    Array.prototype.__setslice__ = function (start, stop, step, source) {
        if (start < 0) {
            start = this.length + start;
        }

        if (stop == null) {
            stop = this.length;
        }
        else if (stop < 0) {
            stop = this.length + stop;
        }

        if (step == null) { // Assign to 'ordinary' slice, replace subsequence
            Array.prototype.splice.apply (this, [start, stop - start] .concat (source));
        }
        else {              // Assign to extended slice, replace designated items one by one
            var sourceIndex = 0;
            for (var targetIndex = start; targetIndex < stop; targetIndex += step) {
                this [targetIndex] = source [sourceIndex++];
            }
        }
    };

    Array.prototype.__repr__ = function () {
        if (this.__class__ == set && !this.length) {
            return 'set()';
        }

        var result = !this.__class__ || this.__class__ == list ? '[' : this.__class__ == tuple ? '(' : '{';

        for (var index = 0; index < this.length; index++) {
            if (index) {
                result += ', ';
            }
            result += repr (this [index]);
        }

        if (this.__class__ == tuple && this.length == 1) {
            result += ',';
        }

        result += !this.__class__ || this.__class__ == list ? ']' : this.__class__ == tuple ? ')' : '}';;
        return result;
    };

    Array.prototype.__str__ = Array.prototype.__repr__;

    Array.prototype.append = function (element) {
        this.push (element);
    };

    Array.prototype.clear = function () {
        this.length = 0;
    };

    Array.prototype.extend = function (aList) {
        this.push.apply (this, aList);
    };

    Array.prototype.insert = function (index, element) {
        this.splice (index, 0, element);
    };

    Array.prototype.remove = function (element) {
        var index = this.indexOf (element);
        if (index == -1) {
            throw ValueError (new Error ());
        }
        this.splice (index, 1);
    };

    Array.prototype.index = function (element) {
        return this.indexOf (element);
    };

    Array.prototype.py_pop = function (index) {
        if (index == undefined) {
            return this.pop ();  // Remove last element
        }
        else {
            return this.splice (index, 1) [0];
        }
    };

    Array.prototype.py_sort = function () {
        __sort__.apply  (null, [this].concat ([] .slice.apply (arguments)));    // Can't work directly with arguments
        // Python params: (iterable, key = None, reverse = False)
        // py_sort is called with the Transcrypt kwargs mechanism, and just passes the params on to __sort__
        // __sort__ is def'ed with the Transcrypt kwargs mechanism
    };

    Array.prototype.__add__ = function (aList) {
        return list (this.concat (aList));
    };

    Array.prototype.__mul__ = function (scalar) {
        var result = this;
        for (var i = 1; i < scalar; i++) {
            result = result.concat (this);
        }
        return result;
    };

    Array.prototype.__rmul__ = Array.prototype.__mul__;

    // Tuple extensions to Array

    function tuple (iterable) {
        var instance = iterable ? [] .slice.apply (iterable) : [];
        instance.__class__ = tuple; // Not all arrays are tuples
        return instance;
    }
    __all__.tuple = tuple;
    tuple.__name__ = 'tuple';

    // Set extensions to Array
    // N.B. Since sets are unordered, set operations will occasionally alter the 'this' array by sorting it

    function set (iterable) {
        var instance = [];
        if (iterable) {
            for (var index = 0; index < iterable.length; index++) {
                instance.add (iterable [index]);
            }


        }
        instance.__class__ = set;   // Not all arrays are sets
        return instance;
    }
    __all__.set = set;
    set.__name__ = 'set';

    Array.prototype.__bindexOf__ = function (element) { // Used to turn O (n^2) into O (n log n)
    // Since sorting is lex, compare has to be lex. This also allows for mixed lists

        element += '';

        var mindex = 0;
        var maxdex = this.length - 1;

        while (mindex <= maxdex) {
            var index = (mindex + maxdex) / 2 | 0;
            var middle = this [index] + '';

            if (middle < element) {
                mindex = index + 1;
            }
            else if (middle > element) {
                maxdex = index - 1;
            }
            else {
                return index;
            }
        }

        return -1;
    };

    Array.prototype.add = function (element) {
        if (this.indexOf (element) == -1) { // Avoid duplicates in set
            this.push (element);
        }
    };

    Array.prototype.discard = function (element) {
        var index = this.indexOf (element);
        if (index != -1) {
            this.splice (index, 1);
        }
    };

    Array.prototype.isdisjoint = function (other) {
        this.sort ();
        for (var i = 0; i < other.length; i++) {
            if (this.__bindexOf__ (other [i]) != -1) {
                return false;
            }
        }
        return true;
    };

    Array.prototype.issuperset = function (other) {
        this.sort ();
        for (var i = 0; i < other.length; i++) {
            if (this.__bindexOf__ (other [i]) == -1) {
                return false;
            }
        }
        return true;
    };

    Array.prototype.issubset = function (other) {
        return set (other.slice ()) .issuperset (this); // Sort copy of 'other', not 'other' itself, since it may be an ordered sequence
    };

    Array.prototype.union = function (other) {
        var result = set (this.slice () .sort ());
        for (var i = 0; i < other.length; i++) {
            if (result.__bindexOf__ (other [i]) == -1) {
                result.push (other [i]);
            }
        }
        return result;
    };

    Array.prototype.intersection = function (other) {
        this.sort ();
        var result = set ();
        for (var i = 0; i < other.length; i++) {
            if (this.__bindexOf__ (other [i]) != -1) {
                result.push (other [i]);
            }
        }
        return result;
    };

    Array.prototype.difference = function (other) {
        var sother = set (other.slice () .sort ());
        var result = set ();
        for (var i = 0; i < this.length; i++) {
            if (sother.__bindexOf__ (this [i]) == -1) {
                result.push (this [i]);
            }
        }
        return result;
    };

    Array.prototype.symmetric_difference = function (other) {
        return this.union (other) .difference (this.intersection (other));
    };

    Array.prototype.py_update = function () {   // O (n)
        var updated = [] .concat.apply (this.slice (), arguments) .sort ();
        this.clear ();
        for (var i = 0; i < updated.length; i++) {
            if (updated [i] != updated [i - 1]) {
                this.push (updated [i]);
            }
        }
    };

    Array.prototype.__eq__ = function (other) { // Also used for list
        if (this.length != other.length) {
            return false;
        }
        if (this.__class__ == set) {
            this.sort ();
            other.sort ();
        }
        for (var i = 0; i < this.length; i++) {
            if (this [i] != other [i]) {
                return false;
            }
        }
        return true;
    };

    Array.prototype.__ne__ = function (other) { // Also used for list
        return !this.__eq__ (other);
    };

    Array.prototype.__le__ = function (other) {
        return this.issubset (other);
    };

    Array.prototype.__ge__ = function (other) {
        return this.issuperset (other);
    };

    Array.prototype.__lt__ = function (other) {
        return this.issubset (other) && !this.issuperset (other);
    };

    Array.prototype.__gt__ = function (other) {
        return this.issuperset (other) && !this.issubset (other);
    };

    // String extensions

    function str (stringable) {
        try {
            return stringable.__str__ ();
        }
        catch (exception) {
            try {
                return repr (stringable);
            }
            catch (exception) {
                return String (stringable); // No new, so no permanent String object but a primitive in a temporary 'just in time' wrapper
            }
        }
    };
    __all__.str = str;

    String.prototype.__class__ = str;   // All strings are str
    str.__name__ = 'str';

    String.prototype.__iter__ = function () {new __PyIterator__ (this);};

    String.prototype.__repr__ = function () {
        return (this.indexOf ('\'') == -1 ? '\'' + this + '\'' : '"' + this + '"') .py_replace ('\t', '\\t') .py_replace ('\n', '\\n');
    };

    String.prototype.__str__ = function () {
        return this;
    };

    String.prototype.capitalize = function () {
        return this.charAt (0).toUpperCase () + this.slice (1);
    };

    String.prototype.endswith = function (suffix) {
        return suffix == '' || this.slice (-suffix.length) == suffix;
    };

    String.prototype.find  = function (sub, start) {
        return this.indexOf (sub, start);
    };

    String.prototype.__getslice__ = function (start, stop, step) {
        if (start < 0) {
            start = this.length + start;
        }

        if (stop == null) {
            stop = this.length;
        }
        else if (stop < 0) {
            stop = this.length + stop;
        }

        var result = '';
        if (step == 1) {
            result = this.substring (start, stop);
        }
        else {
            for (var index = start; index < stop; index += step) {
                result = result.concat (this.charAt(index));
            }
        }
        return result;
    }

    // Since it's worthwhile for the 'format' function to be able to deal with *args, it is defined as a property
    // __get__ will produce a bound function if there's something before the dot
    // Since a call using *args is compiled to e.g. <object>.<function>.apply (null, args), the function has to be bound already
    // Otherwise it will never be, because of the null argument
    // Using 'this' rather than 'null' contradicts the requirement to be able to pass bound functions around
    // The object 'before the dot' won't be available at call time in that case, unless implicitly via the function bound to it
    // While for Python methods this mechanism is generated by the compiler, for JavaScript methods it has to be provided manually
    // Call memoizing is unattractive here, since every string would then have to hold a reference to a bound format method
    __setProperty__ (String.prototype, 'format', {
        get: function () {return __get__ (this, function (self) {
            var args = tuple ([] .slice.apply (arguments).slice (1));
            var autoIndex = 0;
            return self.replace (/\{(\w*)\}/g, function (match, key) {
                if (key == '') {
                    key = autoIndex++;
                }
                if (key == +key) {  // So key is numerical
                    return args [key] == undefined ? match : str (args [key]);
                }
                else {              // Key is a string
                    for (var index = 0; index < args.length; index++) {
                        // Find first 'dict' that has that key and the right field
                        if (typeof args [index] == 'object' && args [index][key] != undefined) {
                            return str (args [index][key]); // Return that field field
                        }
                    }
                    return match;
                }
            });
        });},
        enumerable: true
    });

    String.prototype.isnumeric = function () {
        return !isNaN (parseFloat (this)) && isFinite (this);
    };

    String.prototype.join = function (strings) {
        strings = Array.from (strings); // Much faster than iterating through strings char by char
        return strings.join (this);
    };

    String.prototype.lower = function () {
        return this.toLowerCase ();
    };

    String.prototype.py_replace = function (old, aNew, maxreplace) {
        return this.split (old, maxreplace) .join (aNew);
    };

    String.prototype.lstrip = function () {
        return this.replace (/^\s*/g, '');
    };

    String.prototype.rfind = function (sub, start) {
        return this.lastIndexOf (sub, start);
    };

    String.prototype.rsplit = function (sep, maxsplit) {    // Combination of general whitespace sep and positive maxsplit neither supported nor checked, expensive and rare
        if (sep == undefined || sep == null) {
            sep = /\s+/;
            var stripped = this.strip ();
        }
        else {
            var stripped = this;
        }

        if (maxsplit == undefined || maxsplit == -1) {
            return stripped.split (sep);
        }
        else {
            var result = stripped.split (sep);
            if (maxsplit < result.length) {
                var maxrsplit = result.length - maxsplit;
                return [result.slice (0, maxrsplit) .join (sep)] .concat (result.slice (maxrsplit));
            }
            else {
                return result;
            }
        }
    };

    String.prototype.rstrip = function () {
        return this.replace (/\s*$/g, '');
    };

    String.prototype.py_split = function (sep, maxsplit) {  // Combination of general whitespace sep and positive maxsplit neither supported nor checked, expensive and rare
        if (sep == undefined || sep == null) {
            sep = /\s+/;
            var stripped = this.strip ();
        }
        else {
            var stripped = this;
        }

        if (maxsplit == undefined || maxsplit == -1) {
            return stripped.split (sep);
        }
        else {
            var result = stripped.split (sep);
            if (maxsplit < result.length) {
                return result.slice (0, maxsplit).concat ([result.slice (maxsplit).join (sep)]);
            }
            else {
                return result;
            }
        }
    };

    String.prototype.startswith = function (prefix) {
        return this.indexOf (prefix) == 0;
    };

    String.prototype.strip = function () {
        return this.trim ();
    };

    String.prototype.upper = function () {
        return this.toUpperCase ();
    };

    String.prototype.__mul__ = function (scalar) {
        var result = this;
        for (var i = 1; i < scalar; i++) {
            result = result + this;
        }
        return result;
    };

    String.prototype.__rmul__ = String.prototype.__mul__;

    // Dict extensions to object

    function __keys__ () {
        var keys = [];
        for (var attrib in this) {
            if (!__specialattrib__ (attrib)) {
                keys.push (attrib);
            }
        }
        return keys;
    }

    function __items__ () {
        var items = [];
        for (var attrib in this) {
            if (!__specialattrib__ (attrib)) {
                items.push ([attrib, this [attrib]]);
            }
        }
        return items;
    }

    function __del__ (key) {
        delete this [key];
    }

    function __clear__ () {
        for (var attrib in this) {
            delete this [attrib];
        }
    }

    function __getdefault__ (aKey, aDefault) {  // Each Python object already has a function called __get__, so we call this one __getdefault__
        var result = this [aKey];
        return result == undefined ? (aDefault == undefined ? null : aDefault) : result;
    }

    function __setdefault__ (aKey, aDefault) {
        var result = this [aKey];
        if (result != undefined) {
            return result;
        }
        var val = aDefault == undefined ? null : aDefault;
        this [aKey] = val;
        return val;
    }

    function __pop__ (aKey, aDefault) {
        var result = this [aKey];
        if (result != undefined) {
            delete this [aKey];
            return result;
        } else {
            // Identify check because user could pass None
            if ( aDefault === undefined ) {
                throw KeyError (aKey, new Error());
            }
        }
        return aDefault;
    }
    
    function __popitem__ () {
        var aKey = Object.keys (this) [0];
        if (aKey == null) {
            throw KeyError (aKey, new Error ());
        }
        var result = tuple ([aKey, this [aKey]]);
        delete this [aKey];
        return result;
    }
    
    function __update__ (aDict) {
        for (var aKey in aDict) {
            this [aKey] = aDict [aKey];
        }
    }
    
    function __dgetitem__ (aKey) {
        return this [aKey];
    }
    
    function __dsetitem__ (aKey, aValue) {
        this [aKey] = aValue;
    }

    function dict (objectOrPairs) {
        var instance = {};
        if (!objectOrPairs || objectOrPairs instanceof Array) { // It's undefined or an array of pairs
            if (objectOrPairs) {
                for (var index = 0; index < objectOrPairs.length; index++) {
                    var pair = objectOrPairs [index];
                    if ( !(pair instanceof Array) || pair.length != 2) {
                        throw ValueError(
                            "dict update sequence element #" + index +
                            " has length " + pair.length +
                            "; 2 is required", new Error());
                    }
                    var key = pair [0];
                    var val = pair [1];
                    if (!(objectOrPairs instanceof Array) && objectOrPairs instanceof Object) {
                         // User can potentially pass in an object
                         // that has a hierarchy of objects. This
                         // checks to make sure that these objects
                         // get converted to dict objects instead of
                         // leaving them as js objects.
                         
                         if (!isinstance (objectOrPairs, dict)) {
                             val = dict (val);
                         }
                    }
                    instance [key] = val;
                }
            }
        }
        else {
            if (isinstance (objectOrPairs, dict)) {
                // Passed object is a dict already so we need to be a little careful
                // N.B. - this is a shallow copy per python std - so
                // it is assumed that children have already become
                // python objects at some point.
                
                var aKeys = objectOrPairs.py_keys ();
                for (var index = 0; index < aKeys.length; index++ ) {
                    var key = aKeys [index];
                    instance [key] = objectOrPairs [key];
                }
            } else if (objectOrPairs instanceof Object) {
                // Passed object is a JavaScript object but not yet a dict, don't copy it
                instance = objectOrPairs;
            } else {
                // We have already covered Array so this indicates
                // that the passed object is not a js object - i.e.
                // it is an int or a string, which is invalid.
                
                throw ValueError ("Invalid type of object for dict creation", new Error ());
            }
        }

        // Trancrypt interprets e.g. {aKey: 'aValue'} as a Python dict literal rather than a JavaScript object literal
        // So dict literals rather than bare Object literals will be passed to JavaScript libraries
        // Some JavaScript libraries call all enumerable callable properties of an object that's passed to them
        // So the properties of a dict should be non-enumerable
        __setProperty__ (instance, '__class__', {value: dict, enumerable: false, writable: true});
        __setProperty__ (instance, 'py_keys', {value: __keys__, enumerable: false});
        __setProperty__ (instance, '__iter__', {value: function () {new __PyIterator__ (this.py_keys ());}, enumerable: false});
        __setProperty__ (instance, Symbol.iterator, {value: function () {new __JsIterator__ (this.py_keys ());}, enumerable: false});
        __setProperty__ (instance, 'py_items', {value: __items__, enumerable: false});
        __setProperty__ (instance, 'py_del', {value: __del__, enumerable: false});
        __setProperty__ (instance, 'py_clear', {value: __clear__, enumerable: false});
        __setProperty__ (instance, 'py_get', {value: __getdefault__, enumerable: false});
        __setProperty__ (instance, 'py_setdefault', {value: __setdefault__, enumerable: false});
        __setProperty__ (instance, 'py_pop', {value: __pop__, enumerable: false});
        __setProperty__ (instance, 'py_popitem', {value: __popitem__, enumerable: false});
        __setProperty__ (instance, 'py_update', {value: __update__, enumerable: false});
        __setProperty__ (instance, '__getitem__', {value: __dgetitem__, enumerable: false});    // Needed since compound keys necessarily
        __setProperty__ (instance, '__setitem__', {value: __dsetitem__, enumerable: false});    // trigger overloading to deal with slices
        return instance;
    }

    __all__.dict = dict;
    dict.__name__ = 'dict';
    
    // Docstring setter

    function __setdoc__ (docString) {
        this.__doc__ = docString;
        return this;
    }

    // Python classes, methods and functions are all translated to JavaScript functions
    __setProperty__ (Function.prototype, '__setdoc__', {value: __setdoc__, enumerable: false});

    // General operator overloading, only the ones that make most sense in matrix and complex operations

    var __neg__ = function (a) {
        if (typeof a == 'object' && '__neg__' in a) {
            return a.__neg__ ();
        }
        else {
            return -a;
        }
    };
    __all__.__neg__ = __neg__;

    var __matmul__ = function (a, b) {
        return a.__matmul__ (b);
    };
    __all__.__matmul__ = __matmul__;

    var __pow__ = function (a, b) {
        if (typeof a == 'object' && '__pow__' in a) {
            return a.__pow__ (b);
        }
        else if (typeof b == 'object' && '__rpow__' in b) {
            return b.__rpow__ (a);
        }
        else {
            return Math.pow (a, b);
        }
    };
    __all__.pow = __pow__;

    var __jsmod__ = function (a, b) {
        if (typeof a == 'object' && '__mod__' in a) {
            return a.__mod__ (b);
        }
        else if (typeof b == 'object' && '__rpow__' in b) {
            return b.__rmod__ (a);
        }
        else {
            return a % b;
        }
    };
    __all__.__jsmod__ = __jsmod__;
    
    var __mod__ = function (a, b) {
        if (typeof a == 'object' && '__mod__' in a) {
            return a.__mod__ (b);
        }
        else if (typeof b == 'object' && '__rpow__' in b) {
            return b.__rmod__ (a);
        }
        else {
            return ((a % b) + b) % b;
        }
    };
    __all__.mod = __mod__;

    // Overloaded binary arithmetic
    
    var __mul__ = function (a, b) {
        if (typeof a == 'object' && '__mul__' in a) {
            return a.__mul__ (b);
        }
        else if (typeof b == 'object' && '__rmul__' in b) {
            return b.__rmul__ (a);
        }
        else if (typeof a == 'string') {
            return a.__mul__ (b);
        }
        else if (typeof b == 'string') {
            return b.__rmul__ (a);
        }
        else {
            return a * b;
        }
    };
    __all__.__mul__ = __mul__;

    var __div__ = function (a, b) {
        if (typeof a == 'object' && '__div__' in a) {
            return a.__div__ (b);
        }
        else if (typeof b == 'object' && '__rdiv__' in b) {
            return b.__rdiv__ (a);
        }
        else {
            return a / b;
        }
    };
    __all__.__div__ = __div__;

    var __add__ = function (a, b) {
        if (typeof a == 'object' && '__add__' in a) {
            return a.__add__ (b);
        }
        else if (typeof b == 'object' && '__radd__' in b) {
            return b.__radd__ (a);
        }
        else {
            return a + b;
        }
    };
    __all__.__add__ = __add__;

    var __sub__ = function (a, b) {
        if (typeof a == 'object' && '__sub__' in a) {
            return a.__sub__ (b);
        }
        else if (typeof b == 'object' && '__rsub__' in b) {
            return b.__rsub__ (a);
        }
        else {
            return a - b;
        }
    };
    __all__.__sub__ = __sub__;

    // Overloaded binary bitwise
    
    var __lshift__ = function (a, b) {
        if (typeof a == 'object' && '__lshift__' in a) {
            return a.__lshift__ (b);
        }
        else if (typeof b == 'object' && '__rlshift__' in b) {
            return b.__rlshift__ (a);
        }
        else {
            return a << b;
        }
    };
    __all__.__lshift__ = __lshift__;

    var __rshift__ = function (a, b) {
        if (typeof a == 'object' && '__rshift__' in a) {
            return a.__rshift__ (b);
        }
        else if (typeof b == 'object' && '__rrshift__' in b) {
            return b.__rrshift__ (a);
        }
        else {
            return a >> b;
        }
    };
    __all__.__rshift__ = __rshift__;

    var __or__ = function (a, b) {
        if (typeof a == 'object' && '__or__' in a) {
            return a.__or__ (b);
        }
        else if (typeof b == 'object' && '__ror__' in b) {
            return b.__ror__ (a);
        }
        else {
            return a | b;
        }
    };
    __all__.__or__ = __or__;

    var __xor__ = function (a, b) {
        if (typeof a == 'object' && '__xor__' in a) {
            return a.__xor__ (b);
        }
        else if (typeof b == 'object' && '__rxor__' in b) {
            return b.__rxor__ (a);
        }
        else {
            return a ^ b;
        }
    };
    __all__.__xor__ = __xor__;

    var __and__ = function (a, b) {
        if (typeof a == 'object' && '__and__' in a) {
            return a.__and__ (b);
        }
        else if (typeof b == 'object' && '__rand__' in b) {
            return b.__rand__ (a);
        }
        else {
            return a & b;
        }
    };
    __all__.__and__ = __and__;    
        
    // Overloaded binary compare
    
    var __eq__ = function (a, b) {
        if (typeof a == 'object' && '__eq__' in a) {
            return a.__eq__ (b);
        }
        else {
            return a == b;
        }
    };
    __all__.__eq__ = __eq__;

    var __ne__ = function (a, b) {
        if (typeof a == 'object' && '__ne__' in a) {
            return a.__ne__ (b);
        }
        else {
            return a != b
        }
    };
    __all__.__ne__ = __ne__;

    var __lt__ = function (a, b) {
        if (typeof a == 'object' && '__lt__' in a) {
            return a.__lt__ (b);
        }
        else {
            return a < b;
        }
    };
    __all__.__lt__ = __lt__;

    var __le__ = function (a, b) {
        if (typeof a == 'object' && '__le__' in a) {
            return a.__le__ (b);
        }
        else {
            return a <= b;
        }
    };
    __all__.__le__ = __le__;

    var __gt__ = function (a, b) {
        if (typeof a == 'object' && '__gt__' in a) {
            return a.__gt__ (b);
        }
        else {
            return a > b;
        }
    };
    __all__.__gt__ = __gt__;

    var __ge__ = function (a, b) {
        if (typeof a == 'object' && '__ge__' in a) {
            return a.__ge__ (b);
        }
        else {
            return a >= b;
        }
    };
    __all__.__ge__ = __ge__;
    
    // Overloaded augmented general
    
    var __imatmul__ = function (a, b) {
        if ('__imatmul__' in a) {
            return a.__imatmul__ (b);
        }
        else {
            return a.__matmul__ (b);
        }
    };
    __all__.__imatmul__ = __imatmul__;

    var __ipow__ = function (a, b) {
        if (typeof a == 'object' && '__pow__' in a) {
            return a.__ipow__ (b);
        }
        else if (typeof a == 'object' && '__ipow__' in a) {
            return a.__pow__ (b);
        }
        else if (typeof b == 'object' && '__rpow__' in b) {
            return b.__rpow__ (a);
        }
        else {
            return Math.pow (a, b);
        }
    };
    __all__.ipow = __ipow__;

    var __ijsmod__ = function (a, b) {
        if (typeof a == 'object' && '__imod__' in a) {
            return a.__ismod__ (b);
        }
        else if (typeof a == 'object' && '__mod__' in a) {
            return a.__mod__ (b);
        }
        else if (typeof b == 'object' && '__rpow__' in b) {
            return b.__rmod__ (a);
        }
        else {
            return a % b;
        }
    };
    __all__.ijsmod__ = __ijsmod__;
    
    var __imod__ = function (a, b) {
        if (typeof a == 'object' && '__imod__' in a) {
            return a.__imod__ (b);
        }
        else if (typeof a == 'object' && '__mod__' in a) {
            return a.__mod__ (b);
        }
        else if (typeof b == 'object' && '__rpow__' in b) {
            return b.__rmod__ (a);
        }
        else {
            return ((a % b) + b) % b;
        }
    };
    __all__.imod = __imod__;
    
    // Overloaded augmented arithmetic
    
    var __imul__ = function (a, b) {
        if (typeof a == 'object' && '__imul__' in a) {
            return a.__imul__ (b);
        }
        else if (typeof a == 'object' && '__mul__' in a) {
            return a = a.__mul__ (b);
        }
        else if (typeof b == 'object' && '__rmul__' in b) {
            return a = b.__rmul__ (a);
        }
        else if (typeof a == 'string') {
            return a = a.__mul__ (b);
        }
        else if (typeof b == 'string') {
            return a = b.__rmul__ (a);
        }
        else {
            return a *= b;
        }
    };
    __all__.__imul__ = __imul__;

    var __idiv__ = function (a, b) {
        if (typeof a == 'object' && '__idiv__' in a) {
            return a.__idiv__ (b);
        }
        else if (typeof a == 'object' && '__div__' in a) {
            return a = a.__div__ (b);
        }
        else if (typeof b == 'object' && '__rdiv__' in b) {
            return a = b.__rdiv__ (a);
        }
        else {
            return a /= b;
        }
    };
    __all__.__idiv__ = __idiv__;

    var __iadd__ = function (a, b) {
        if (typeof a == 'object' && '__iadd__' in a) {
            return a.__iadd__ (b);
        }
        else if (typeof a == 'object' && '__add__' in a) {
            return a = a.__add__ (b);
        }
        else if (typeof b == 'object' && '__radd__' in b) {
            return a = b.__radd__ (a);
        }
        else {
            return a += b;
        }
    };
    __all__.__iadd__ = __iadd__;

    var __isub__ = function (a, b) {
        if (typeof a == 'object' && '__isub__' in a) {
            return a.__isub__ (b);
        }
        else if (typeof a == 'object' && '__sub__' in a) {
            return a = a.__sub__ (b);
        }
        else if (typeof b == 'object' && '__rsub__' in b) {
            return a = b.__rsub__ (a);
        }
        else {
            return a -= b;
        }
    };
    __all__.__isub__ = __isub__;

    // Overloaded augmented bitwise
    
    var __ilshift__ = function (a, b) {
        if (typeof a == 'object' && '__ilshift__' in a) {
            return a.__ilshift__ (b);
        }
        else if (typeof a == 'object' && '__lshift__' in a) {
            return a = a.__lshift__ (b);
        }
        else if (typeof b == 'object' && '__rlshift__' in b) {
            return a = b.__rlshift__ (a);
        }
        else {
            return a <<= b;
        }
    };
    __all__.__ilshift__ = __ilshift__;

    var __irshift__ = function (a, b) {
        if (typeof a == 'object' && '__irshift__' in a) {
            return a.__irshift__ (b);
        }
        else if (typeof a == 'object' && '__rshift__' in a) {
            return a = a.__rshift__ (b);
        }
        else if (typeof b == 'object' && '__rrshift__' in b) {
            return a = b.__rrshift__ (a);
        }
        else {
            return a >>= b;
        }
    };
    __all__.__irshift__ = __irshift__;

    var __ior__ = function (a, b) {
        if (typeof a == 'object' && '__ior__' in a) {
            return a.__ior__ (b);
        }
        else if (typeof a == 'object' && '__or__' in a) {
            return a = a.__or__ (b);
        }
        else if (typeof b == 'object' && '__ror__' in b) {
            return a = b.__ror__ (a);
        }
        else {
            return a |= b;
        }
    };
    __all__.__ior__ = __ior__;

    var __ixor__ = function (a, b) {
        if (typeof a == 'object' && '__ixor__' in a) {
            return a.__ixor__ (b);
        }
        else if (typeof a == 'object' && '__xor__' in a) {
            return a = a.__xor__ (b);
        }
        else if (typeof b == 'object' && '__rxor__' in b) {
            return a = b.__rxor__ (a);
        }
        else {
            return a ^= b;
        }
    };
    __all__.__ixor__ = __ixor__;

    var __iand__ = function (a, b) {
        if (typeof a == 'object' && '__iand__' in a) {
            return a.__iand__ (b);
        }
        else if (typeof a == 'object' && '__and__' in a) {
            return a = a.__and__ (b);
        }
        else if (typeof b == 'object' && '__rand__' in b) {
            return a = b.__rand__ (a);
        }
        else {
            return a &= b;
        }
    };
    __all__.__iand__ = __iand__;
    
    // Indices and slices

    var __getitem__ = function (container, key) {                           // Slice c.q. index, direct generated call to runtime switch
        if (typeof container == 'object' && '__getitem__' in container) {
            return container.__getitem__ (key);                             // Overloaded on container
        }
        else {
            return container [key];                                         // Container must support bare JavaScript brackets
        }
    };
    __all__.__getitem__ = __getitem__;

    var __setitem__ = function (container, key, value) {                    // Slice c.q. index, direct generated call to runtime switch
        if (typeof container == 'object' && '__setitem__' in container) {
            container.__setitem__ (key, value);                             // Overloaded on container
        }
        else {
            container [key] = value;                                        // Container must support bare JavaScript brackets
        }
    };
    __all__.__setitem__ = __setitem__;

    var __getslice__ = function (container, lower, upper, step) {           // Slice only, no index, direct generated call to runtime switch
        if (typeof container == 'object' && '__getitem__' in container) {
            return container.__getitem__ ([lower, upper, step]);            // Container supports overloaded slicing c.q. indexing
        }
        else {
            return container.__getslice__ (lower, upper, step);             // Container only supports slicing injected natively in prototype
        }
    };
    __all__.__getslice__ = __getslice__;

    var __setslice__ = function (container, lower, upper, step, value) {    // Slice, no index, direct generated call to runtime switch
        if (typeof container == 'object' && '__setitem__' in container) {
            container.__setitem__ ([lower, upper, step], value);            // Container supports overloaded slicing c.q. indexing
        }
        else {
            container.__setslice__ (lower, upper, step, value);             // Container only supports slicing injected natively in prototype
        }
    };
    __all__.__setslice__ = __setslice__;

	__nest__ (
		__all__,
		'controls', {
			__all__: {
				__inited__: false,
				__init__: function (__all__) {
					var clamp = __init__ (__world__.utils).clamp;
					var Keyboard = __class__ ('Keyboard', [object], {
						get __init__ () {return __get__ (this, function (self) {
							self.keyboard = dict ({0: false});
							self.handlers = dict ({});
						});},
						get key_down () {return __get__ (this, function (self, key) {
							self.keyboard [key.key] = true;
						});},
						get key_up () {return __get__ (this, function (self, key) {
							self.keyboard [key.key] = false;
						});},
						get py_get () {return __get__ (this, function (self, key) {
							return self.keyboard.py_get (key, false);
						});},
						get get_axis () {return __get__ (this, function (self, key) {
							return self.handlers [key].value;
						});},
						get add_handler () {return __get__ (this, function (self, py_name, handler) {
							self.handlers [py_name] = handler;
						});},
						get py_update () {return __get__ (this, function (self, interval) {
							for (var [_, eachhandler] of self.handlers.py_items ()) {
								eachhandler.py_update (self, interval);
							}
						});},
						get py_clear () {return __get__ (this, function (self, axis) {
							self.handlers.py_get (axis).value = 0;
						});}
					});
					var ControlAxis = __class__ ('ControlAxis', [object], {
						get __init__ () {return __get__ (this, function (self, positive_key, negative_key, attack, decay, deadzone) {
							if (typeof attack == 'undefined' || (attack != null && attack .hasOwnProperty ("__kwargtrans__"))) {;
								var attack = 1;
							};
							if (typeof decay == 'undefined' || (decay != null && decay .hasOwnProperty ("__kwargtrans__"))) {;
								var decay = 0;
							};
							if (typeof deadzone == 'undefined' || (deadzone != null && deadzone .hasOwnProperty ("__kwargtrans__"))) {;
								var deadzone = 0.02;
							};
							if (arguments.length) {
								var __ilastarg0__ = arguments.length - 1;
								if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
									var __allkwargs0__ = arguments [__ilastarg0__--];
									for (var __attrib0__ in __allkwargs0__) {
										switch (__attrib0__) {
											case 'self': var self = __allkwargs0__ [__attrib0__]; break;
											case 'positive_key': var positive_key = __allkwargs0__ [__attrib0__]; break;
											case 'negative_key': var negative_key = __allkwargs0__ [__attrib0__]; break;
											case 'attack': var attack = __allkwargs0__ [__attrib0__]; break;
											case 'decay': var decay = __allkwargs0__ [__attrib0__]; break;
											case 'deadzone': var deadzone = __allkwargs0__ [__attrib0__]; break;
										}
									}
								}
							}
							else {
							}
							self.positive = positive_key;
							self.negative = negative_key;
							self.attack = attack;
							self.decay = decay;
							self.deadzone = deadzone;
							self.value = 0;
						});},
						get py_update () {return __get__ (this, function (self, keyboard, interval) {
							self.value -= (interval * self.decay) * self.value;
							var dz = abs (self.value) < self.deadzone;
							if (keyboard.py_get (self.positive)) {
								var dz = false;
								self.value += interval * self.attack;
							}
							if (keyboard.py_get (self.negative)) {
								var dz = false;
								self.value -= interval * self.attack;
							}
							if (dz) {
								self.value = 0;
							}
							else {
								self.value = clamp (self.value, -(1), 1);
							}
						});}
					});
					__pragma__ ('<use>' +
						'utils' +
					'</use>')
					__pragma__ ('<all>')
						__all__.ControlAxis = ControlAxis;
						__all__.Keyboard = Keyboard;
						__all__.clamp = clamp;
					__pragma__ ('</all>')
				}
			}
		}
	);
	__nest__ (
		__all__,
		'org.threejs', {
			__all__: {
				__inited__: false,
				__init__: function (__all__) {
					var _ctor = function (obj) {
						var _c_ = function () {
							var args = tuple ([].slice.apply (arguments).slice (0));
							return new obj (...args);
						};
						return _c_;
					};
					var api = THREE
					var WebGLRenderTargetCube = _ctor (api.WebGLRenderTargetCube);
					var WebGLRenderTarget = _ctor (api.WebGLRenderTarget);
					var WebGLRenderer = _ctor (api.WebGLRenderer);
					var ShaderLib = _ctor (api.ShaderLib);
					var UniformsLib = _ctor (api.UniformsLib);
					var UniformsUtils = _ctor (api.UniformsUtils);
					var ShaderChunk = _ctor (api.ShaderChunk);
					var FogExp2 = _ctor (api.FogExp2);
					var Fog = _ctor (api.Fog);
					var Scene = _ctor (api.Scene);
					var LensFlare = _ctor (api.LensFlare);
					var Sprite = _ctor (api.Sprite);
					var LOD = _ctor (api.LOD);
					var SkinnedMesh = _ctor (api.SkinnedMesh);
					var Skeleton = _ctor (api.Skeleton);
					var Bone = _ctor (api.Bone);
					var Mesh = _ctor (api.Mesh);
					var LineSegments = _ctor (api.LineSegments);
					var LineLoop = _ctor (api.LineLoop);
					var Line = _ctor (api.Line);
					var Points = _ctor (api.Points);
					var Group = _ctor (api.Group);
					var VideoTexture = _ctor (api.VideoTexture);
					var DataTexture = _ctor (api.DataTexture);
					var CompressedTexture = _ctor (api.CompressedTexture);
					var CubeTexture = _ctor (api.CubeTexture);
					var CanvasTexture = _ctor (api.CanvasTexture);
					var DepthTexture = _ctor (api.DepthTexture);
					var Texture = _ctor (api.Texture);
					var CompressedTextureLoader = _ctor (api.CompressedTextureLoader);
					var DataTextureLoader = _ctor (api.DataTextureLoader);
					var CubeTextureLoader = _ctor (api.CubeTextureLoader);
					var TextureLoader = _ctor (api.TextureLoader);
					var ObjectLoader = _ctor (api.ObjectLoader);
					var MaterialLoader = _ctor (api.MaterialLoader);
					var BufferGeometryLoader = _ctor (api.BufferGeometryLoader);
					var DefaultLoadingManager = _ctor (api.DefaultLoadingManager);
					var LoadingManager = _ctor (api.LoadingManager);
					var JSONLoader = _ctor (api.JSONLoader);
					var ImageLoader = _ctor (api.ImageLoader);
					var FontLoader = _ctor (api.FontLoader);
					var FileLoader = _ctor (api.FileLoader);
					var Loader = _ctor (api.Loader);
					var Cache = _ctor (api.Cache);
					var AudioLoader = _ctor (api.AudioLoader);
					var SpotLightShadow = _ctor (api.SpotLightShadow);
					var SpotLight = _ctor (api.SpotLight);
					var PointLight = _ctor (api.PointLight);
					var RectAreaLight = _ctor (api.RectAreaLight);
					var HemisphereLight = _ctor (api.HemisphereLight);
					var DirectionalLightShadow = _ctor (api.DirectionalLightShadow);
					var DirectionalLight = _ctor (api.DirectionalLight);
					var AmbientLight = _ctor (api.AmbientLight);
					var LightShadow = _ctor (api.LightShadow);
					var Light = _ctor (api.Light);
					var StereoCamera = _ctor (api.StereoCamera);
					var PerspectiveCamera = _ctor (api.PerspectiveCamera);
					var OrthographicCamera = _ctor (api.OrthographicCamera);
					var CubeCamera = _ctor (api.CubeCamera);
					var ArrayCamera = _ctor (api.ArrayCamera);
					var Camera = _ctor (api.Camera);
					var AudioListener = _ctor (api.AudioListener);
					var PositionalAudio = _ctor (api.PositionalAudio);
					var AudioContext = _ctor (api.AudioContext);
					var AudioAnalyser = _ctor (api.AudioAnalyser);
					var Audio = _ctor (api.Audio);
					var VectorKeyframeTrack = _ctor (api.VectorKeyframeTrack);
					var StringKeyframeTrack = _ctor (api.StringKeyframeTrack);
					var QuaternionKeyframeTrack = _ctor (api.QuaternionKeyframeTrack);
					var NumberKeyframeTrack = _ctor (api.NumberKeyframeTrack);
					var ColorKeyframeTrack = _ctor (api.ColorKeyframeTrack);
					var BooleanKeyframeTrack = _ctor (api.BooleanKeyframeTrack);
					var PropertyMixer = _ctor (api.PropertyMixer);
					var PropertyBinding = _ctor (api.PropertyBinding);
					var KeyframeTrack = _ctor (api.KeyframeTrack);
					var AnimationUtils = _ctor (api.AnimationUtils);
					var AnimationObjectGroup = _ctor (api.AnimationObjectGroup);
					var AnimationMixer = _ctor (api.AnimationMixer);
					var AnimationClip = _ctor (api.AnimationClip);
					var Uniform = _ctor (api.Uniform);
					var InstancedBufferGeometry = _ctor (api.InstancedBufferGeometry);
					var BufferGeometry = _ctor (api.BufferGeometry);
					var GeometryIdCount = _ctor (api.GeometryIdCount);
					var Geometry = _ctor (api.Geometry);
					var InterleavedBufferAttribute = _ctor (api.InterleavedBufferAttribute);
					var InstancedInterleavedBuffer = _ctor (api.InstancedInterleavedBuffer);
					var InterleavedBuffer = _ctor (api.InterleavedBuffer);
					var InstancedBufferAttribute = _ctor (api.InstancedBufferAttribute);
					var Face3 = _ctor (api.Face3);
					var Object3D = _ctor (api.Object3D);
					var Raycaster = _ctor (api.Raycaster);
					var Layers = _ctor (api.Layers);
					var EventDispatcher = _ctor (api.EventDispatcher);
					var Clock = _ctor (api.Clock);
					var QuaternionLinearInterpolant = _ctor (api.QuaternionLinearInterpolant);
					var LinearInterpolant = _ctor (api.LinearInterpolant);
					var DiscreteInterpolant = _ctor (api.DiscreteInterpolant);
					var CubicInterpolant = _ctor (api.CubicInterpolant);
					var Interpolant = _ctor (api.Interpolant);
					var Triangle = _ctor (api.Triangle);
					var Math = _ctor (api.Math);
					var Spherical = _ctor (api.Spherical);
					var Cylindrical = _ctor (api.Cylindrical);
					var Plane = _ctor (api.Plane);
					var Frustum = _ctor (api.Frustum);
					var Sphere = _ctor (api.Sphere);
					var Ray = _ctor (api.Ray);
					var Matrix4 = _ctor (api.Matrix4);
					var Matrix3 = _ctor (api.Matrix3);
					var Box3 = _ctor (api.Box3);
					var Box2 = _ctor (api.Box2);
					var Line3 = _ctor (api.Line3);
					var Euler = _ctor (api.Euler);
					var Vector3 = _ctor (api.Vector3);
					var Quaternion = _ctor (api.Quaternion);
					var Color = _ctor (api.Color);
					var MorphBlendMesh = _ctor (api.MorphBlendMesh);
					var ImmediateRenderObject = _ctor (api.ImmediateRenderObject);
					var VertexNormalsHelper = _ctor (api.VertexNormalsHelper);
					var SpotLightHelper = _ctor (api.SpotLightHelper);
					var SkeletonHelper = _ctor (api.SkeletonHelper);
					var PointLightHelper = _ctor (api.PointLightHelper);
					var RectAreaLightHelper = _ctor (api.RectAreaLightHelper);
					var HemisphereLightHelper = _ctor (api.HemisphereLightHelper);
					var GridHelper = _ctor (api.GridHelper);
					var PolarGridHelper = _ctor (api.PolarGridHelper);
					var FaceNormalsHelper = _ctor (api.FaceNormalsHelper);
					var DirectionalLightHelper = _ctor (api.DirectionalLightHelper);
					var CameraHelper = _ctor (api.CameraHelper);
					var BoxHelper = _ctor (api.BoxHelper);
					var ArrowHelper = _ctor (api.ArrowHelper);
					var AxisHelper = _ctor (api.AxisHelper);
					var CatmullRomCurve3 = _ctor (api.CatmullRomCurve3);
					var CubicBezierCurve3 = _ctor (api.CubicBezierCurve3);
					var QuadraticBezierCurve3 = _ctor (api.QuadraticBezierCurve3);
					var LineCurve3 = _ctor (api.LineCurve3);
					var ArcCurve = _ctor (api.ArcCurve);
					var EllipseCurve = _ctor (api.EllipseCurve);
					var SplineCurve = _ctor (api.SplineCurve);
					var CubicBezierCurve = _ctor (api.CubicBezierCurve);
					var QuadraticBezierCurve = _ctor (api.QuadraticBezierCurve);
					var LineCurve = _ctor (api.LineCurve);
					var Shape = _ctor (api.Shape);
					var Path = _ctor (api.Path);
					var ShapePath = _ctor (api.ShapePath);
					var Font = _ctor (api.Font);
					var CurvePath = _ctor (api.CurvePath);
					var Curve = _ctor (api.Curve);
					var ShapeUtils = _ctor (api.ShapeUtils);
					var SceneUtils = _ctor (api.SceneUtils);
					var WireframeGeometry = _ctor (api.WireframeGeometry);
					var ParametricGeometry = _ctor (api.ParametricGeometry);
					var ParametricBufferGeometry = _ctor (api.ParametricBufferGeometry);
					var TetrahedronGeometry = _ctor (api.TetrahedronGeometry);
					var TetrahedronBufferGeometry = _ctor (api.TetrahedronBufferGeometry);
					var OctahedronGeometry = _ctor (api.OctahedronGeometry);
					var OctahedronBufferGeometry = _ctor (api.OctahedronBufferGeometry);
					var IcosahedronGeometry = _ctor (api.IcosahedronGeometry);
					var IcosahedronBufferGeometry = _ctor (api.IcosahedronBufferGeometry);
					var DodecahedronGeometry = _ctor (api.DodecahedronGeometry);
					var DodecahedronBufferGeometry = _ctor (api.DodecahedronBufferGeometry);
					var PolyhedronGeometry = _ctor (api.PolyhedronGeometry);
					var PolyhedronBufferGeometry = _ctor (api.PolyhedronBufferGeometry);
					var TubeGeometry = _ctor (api.TubeGeometry);
					var TubeBufferGeometry = _ctor (api.TubeBufferGeometry);
					var TorusKnotGeometry = _ctor (api.TorusKnotGeometry);
					var TorusKnotBufferGeometry = _ctor (api.TorusKnotBufferGeometry);
					var TorusGeometry = _ctor (api.TorusGeometry);
					var TorusBufferGeometry = _ctor (api.TorusBufferGeometry);
					var TextGeometry = _ctor (api.TextGeometry);
					var TextBufferGeometry = _ctor (api.TextBufferGeometry);
					var SphereGeometry = _ctor (api.SphereGeometry);
					var SphereBufferGeometry = _ctor (api.SphereBufferGeometry);
					var RingGeometry = _ctor (api.RingGeometry);
					var RingBufferGeometry = _ctor (api.RingBufferGeometry);
					var PlaneGeometry = _ctor (api.PlaneGeometry);
					var PlaneBufferGeometry = _ctor (api.PlaneBufferGeometry);
					var LatheGeometry = _ctor (api.LatheGeometry);
					var LatheBufferGeometry = _ctor (api.LatheBufferGeometry);
					var ShapeGeometry = _ctor (api.ShapeGeometry);
					var ShapeBufferGeometry = _ctor (api.ShapeBufferGeometry);
					var ExtrudeGeometry = _ctor (api.ExtrudeGeometry);
					var ExtrudeBufferGeometry = _ctor (api.ExtrudeBufferGeometry);
					var EdgesGeometry = _ctor (api.EdgesGeometry);
					var ConeGeometry = _ctor (api.ConeGeometry);
					var ConeBufferGeometry = _ctor (api.ConeBufferGeometry);
					var CylinderGeometry = _ctor (api.CylinderGeometry);
					var CylinderBufferGeometry = _ctor (api.CylinderBufferGeometry);
					var CircleGeometry = _ctor (api.CircleGeometry);
					var CircleBufferGeometry = _ctor (api.CircleBufferGeometry);
					var BoxGeometry = _ctor (api.BoxGeometry);
					var BoxBufferGeometry = _ctor (api.BoxBufferGeometry);
					var ShadowMaterial = _ctor (api.ShadowMaterial);
					var SpriteMaterial = _ctor (api.SpriteMaterial);
					var RawShaderMaterial = _ctor (api.RawShaderMaterial);
					var ShaderMaterial = _ctor (api.ShaderMaterial);
					var PointsMaterial = _ctor (api.PointsMaterial);
					var MeshPhysicalMaterial = _ctor (api.MeshPhysicalMaterial);
					var MeshStandardMaterial = _ctor (api.MeshStandardMaterial);
					var MeshPhongMaterial = _ctor (api.MeshPhongMaterial);
					var MeshToonMaterial = _ctor (api.MeshToonMaterial);
					var MeshNormalMaterial = _ctor (api.MeshNormalMaterial);
					var MeshLambertMaterial = _ctor (api.MeshLambertMaterial);
					var MeshDepthMaterial = _ctor (api.MeshDepthMaterial);
					var MeshBasicMaterial = _ctor (api.MeshBasicMaterial);
					var LineDashedMaterial = _ctor (api.LineDashedMaterial);
					var LineBasicMaterial = _ctor (api.LineBasicMaterial);
					var Material = _ctor (api.Material);
					var Float64BufferAttribute = _ctor (api.Float64BufferAttribute);
					var Float32BufferAttribute = _ctor (api.Float32BufferAttribute);
					var Uint32BufferAttribute = _ctor (api.Uint32BufferAttribute);
					var Int32BufferAttribute = _ctor (api.Int32BufferAttribute);
					var Uint16BufferAttribute = _ctor (api.Uint16BufferAttribute);
					var Int16BufferAttribute = _ctor (api.Int16BufferAttribute);
					var Uint8ClampedBufferAttribute = _ctor (api.Uint8ClampedBufferAttribute);
					var Uint8BufferAttribute = _ctor (api.Uint8BufferAttribute);
					var Int8BufferAttribute = _ctor (api.Int8BufferAttribute);
					var BufferAttribute = _ctor (api.BufferAttribute);
					var REVISION = _ctor (api.REVISION);
					var MOUSE = _ctor (api.MOUSE);
					var CullFaceNone = _ctor (api.CullFaceNone);
					var CullFaceBack = _ctor (api.CullFaceBack);
					var CullFaceFront = _ctor (api.CullFaceFront);
					var CullFaceFrontBack = _ctor (api.CullFaceFrontBack);
					var FrontFaceDirectionCW = _ctor (api.FrontFaceDirectionCW);
					var FrontFaceDirectionCCW = _ctor (api.FrontFaceDirectionCCW);
					var BasicShadowMap = _ctor (api.BasicShadowMap);
					var PCFShadowMap = _ctor (api.PCFShadowMap);
					var PCFSoftShadowMap = _ctor (api.PCFSoftShadowMap);
					var FrontSide = _ctor (api.FrontSide);
					var BackSide = _ctor (api.BackSide);
					var DoubleSide = _ctor (api.DoubleSide);
					var FlatShading = _ctor (api.FlatShading);
					var SmoothShading = _ctor (api.SmoothShading);
					var NoColors = _ctor (api.NoColors);
					var FaceColors = _ctor (api.FaceColors);
					var VertexColors = _ctor (api.VertexColors);
					var NoBlending = _ctor (api.NoBlending);
					var NormalBlending = _ctor (api.NormalBlending);
					var AdditiveBlending = _ctor (api.AdditiveBlending);
					var SubtractiveBlending = _ctor (api.SubtractiveBlending);
					var MultiplyBlending = _ctor (api.MultiplyBlending);
					var CustomBlending = _ctor (api.CustomBlending);
					var AddEquation = _ctor (api.AddEquation);
					var SubtractEquation = _ctor (api.SubtractEquation);
					var ReverseSubtractEquation = _ctor (api.ReverseSubtractEquation);
					var MinEquation = _ctor (api.MinEquation);
					var MaxEquation = _ctor (api.MaxEquation);
					var ZeroFactor = _ctor (api.ZeroFactor);
					var OneFactor = _ctor (api.OneFactor);
					var SrcColorFactor = _ctor (api.SrcColorFactor);
					var OneMinusSrcColorFactor = _ctor (api.OneMinusSrcColorFactor);
					var SrcAlphaFactor = _ctor (api.SrcAlphaFactor);
					var OneMinusSrcAlphaFactor = _ctor (api.OneMinusSrcAlphaFactor);
					var DstAlphaFactor = _ctor (api.DstAlphaFactor);
					var OneMinusDstAlphaFactor = _ctor (api.OneMinusDstAlphaFactor);
					var DstColorFactor = _ctor (api.DstColorFactor);
					var OneMinusDstColorFactor = _ctor (api.OneMinusDstColorFactor);
					var SrcAlphaSaturateFactor = _ctor (api.SrcAlphaSaturateFactor);
					var NeverDepth = _ctor (api.NeverDepth);
					var AlwaysDepth = _ctor (api.AlwaysDepth);
					var LessDepth = _ctor (api.LessDepth);
					var LessEqualDepth = _ctor (api.LessEqualDepth);
					var EqualDepth = _ctor (api.EqualDepth);
					var GreaterEqualDepth = _ctor (api.GreaterEqualDepth);
					var GreaterDepth = _ctor (api.GreaterDepth);
					var NotEqualDepth = _ctor (api.NotEqualDepth);
					var MultiplyOperation = _ctor (api.MultiplyOperation);
					var MixOperation = _ctor (api.MixOperation);
					var AddOperation = _ctor (api.AddOperation);
					var NoToneMapping = _ctor (api.NoToneMapping);
					var LinearToneMapping = _ctor (api.LinearToneMapping);
					var ReinhardToneMapping = _ctor (api.ReinhardToneMapping);
					var Uncharted2ToneMapping = _ctor (api.Uncharted2ToneMapping);
					var CineonToneMapping = _ctor (api.CineonToneMapping);
					var UVMapping = _ctor (api.UVMapping);
					var CubeReflectionMapping = _ctor (api.CubeReflectionMapping);
					var CubeRefractionMapping = _ctor (api.CubeRefractionMapping);
					var EquirectangularReflectionMapping = _ctor (api.EquirectangularReflectionMapping);
					var EquirectangularRefractionMapping = _ctor (api.EquirectangularRefractionMapping);
					var SphericalReflectionMapping = _ctor (api.SphericalReflectionMapping);
					var CubeUVReflectionMapping = _ctor (api.CubeUVReflectionMapping);
					var CubeUVRefractionMapping = _ctor (api.CubeUVRefractionMapping);
					var RepeatWrapping = _ctor (api.RepeatWrapping);
					var ClampToEdgeWrapping = _ctor (api.ClampToEdgeWrapping);
					var MirroredRepeatWrapping = _ctor (api.MirroredRepeatWrapping);
					var NearestFilter = _ctor (api.NearestFilter);
					var NearestMipMapNearestFilter = _ctor (api.NearestMipMapNearestFilter);
					var NearestMipMapLinearFilter = _ctor (api.NearestMipMapLinearFilter);
					var LinearFilter = _ctor (api.LinearFilter);
					var LinearMipMapNearestFilter = _ctor (api.LinearMipMapNearestFilter);
					var LinearMipMapLinearFilter = _ctor (api.LinearMipMapLinearFilter);
					var UnsignedByteType = _ctor (api.UnsignedByteType);
					var ByteType = _ctor (api.ByteType);
					var ShortType = _ctor (api.ShortType);
					var UnsignedShortType = _ctor (api.UnsignedShortType);
					var IntType = _ctor (api.IntType);
					var UnsignedIntType = _ctor (api.UnsignedIntType);
					var FloatType = _ctor (api.FloatType);
					var HalfFloatType = _ctor (api.HalfFloatType);
					var UnsignedShort4444Type = _ctor (api.UnsignedShort4444Type);
					var UnsignedShort5551Type = _ctor (api.UnsignedShort5551Type);
					var UnsignedShort565Type = _ctor (api.UnsignedShort565Type);
					var UnsignedInt248Type = _ctor (api.UnsignedInt248Type);
					var AlphaFormat = _ctor (api.AlphaFormat);
					var RGBFormat = _ctor (api.RGBFormat);
					var RGBAFormat = _ctor (api.RGBAFormat);
					var LuminanceFormat = _ctor (api.LuminanceFormat);
					var LuminanceAlphaFormat = _ctor (api.LuminanceAlphaFormat);
					var RGBEFormat = _ctor (api.RGBEFormat);
					var DepthFormat = _ctor (api.DepthFormat);
					var DepthStencilFormat = _ctor (api.DepthStencilFormat);
					var RGB_S3TC_DXT1_Format = _ctor (api.RGB_S3TC_DXT1_Format);
					var RGBA_S3TC_DXT1_Format = _ctor (api.RGBA_S3TC_DXT1_Format);
					var RGBA_S3TC_DXT3_Format = _ctor (api.RGBA_S3TC_DXT3_Format);
					var RGBA_S3TC_DXT5_Format = _ctor (api.RGBA_S3TC_DXT5_Format);
					var RGB_PVRTC_4BPPV1_Format = _ctor (api.RGB_PVRTC_4BPPV1_Format);
					var RGB_PVRTC_2BPPV1_Format = _ctor (api.RGB_PVRTC_2BPPV1_Format);
					var RGBA_PVRTC_4BPPV1_Format = _ctor (api.RGBA_PVRTC_4BPPV1_Format);
					var RGBA_PVRTC_2BPPV1_Format = _ctor (api.RGBA_PVRTC_2BPPV1_Format);
					var RGB_ETC1_Format = _ctor (api.RGB_ETC1_Format);
					var LoopOnce = _ctor (api.LoopOnce);
					var LoopRepeat = _ctor (api.LoopRepeat);
					var LoopPingPong = _ctor (api.LoopPingPong);
					var InterpolateDiscrete = _ctor (api.InterpolateDiscrete);
					var InterpolateLinear = _ctor (api.InterpolateLinear);
					var InterpolateSmooth = _ctor (api.InterpolateSmooth);
					var ZeroCurvatureEnding = _ctor (api.ZeroCurvatureEnding);
					var ZeroSlopeEnding = _ctor (api.ZeroSlopeEnding);
					var WrapAroundEnding = _ctor (api.WrapAroundEnding);
					var TrianglesDrawMode = _ctor (api.TrianglesDrawMode);
					var TriangleStripDrawMode = _ctor (api.TriangleStripDrawMode);
					var TriangleFanDrawMode = _ctor (api.TriangleFanDrawMode);
					var LinearEncoding = _ctor (api.LinearEncoding);
					var sRGBEncoding = _ctor (api.sRGBEncoding);
					var GammaEncoding = _ctor (api.GammaEncoding);
					var RGBEEncoding = _ctor (api.RGBEEncoding);
					var LogLuvEncoding = _ctor (api.LogLuvEncoding);
					var RGBM7Encoding = _ctor (api.RGBM7Encoding);
					var RGBM16Encoding = _ctor (api.RGBM16Encoding);
					var RGBDEncoding = _ctor (api.RGBDEncoding);
					var BasicDepthPacking = _ctor (api.BasicDepthPacking);
					var RGBADepthPacking = _ctor (api.RGBADepthPacking);
					var CubeGeometry = _ctor (api.CubeGeometry);
					var Face4 = _ctor (api.Face4);
					var LineStrip = _ctor (api.LineStrip);
					var LinePieces = _ctor (api.LinePieces);
					var MeshFaceMaterial = _ctor (api.MeshFaceMaterial);
					var MultiMaterial = _ctor (api.MultiMaterial);
					var PointCloud = _ctor (api.PointCloud);
					var Particle = _ctor (api.Particle);
					var ParticleSystem = _ctor (api.ParticleSystem);
					var PointCloudMaterial = _ctor (api.PointCloudMaterial);
					var ParticleBasicMaterial = _ctor (api.ParticleBasicMaterial);
					var ParticleSystemMaterial = _ctor (api.ParticleSystemMaterial);
					var Vertex = _ctor (api.Vertex);
					var DynamicBufferAttribute = _ctor (api.DynamicBufferAttribute);
					var Int8Attribute = _ctor (api.Int8Attribute);
					var Uint8Attribute = _ctor (api.Uint8Attribute);
					var Uint8ClampedAttribute = _ctor (api.Uint8ClampedAttribute);
					var Int16Attribute = _ctor (api.Int16Attribute);
					var Uint16Attribute = _ctor (api.Uint16Attribute);
					var Int32Attribute = _ctor (api.Int32Attribute);
					var Uint32Attribute = _ctor (api.Uint32Attribute);
					var Float32Attribute = _ctor (api.Float32Attribute);
					var Float64Attribute = _ctor (api.Float64Attribute);
					var ClosedSplineCurve3 = _ctor (api.ClosedSplineCurve3);
					var SplineCurve3 = _ctor (api.SplineCurve3);
					var Spline = _ctor (api.Spline);
					var BoundingBoxHelper = _ctor (api.BoundingBoxHelper);
					var EdgesHelper = _ctor (api.EdgesHelper);
					var WireframeHelper = _ctor (api.WireframeHelper);
					var XHRLoader = _ctor (api.XHRLoader);
					var BinaryTextureLoader = _ctor (api.BinaryTextureLoader);
					var GeometryUtils = _ctor (api.GeometryUtils);
					var ImageUtils = _ctor (api.ImageUtils);
					var Projector = _ctor (api.Projector);
					var CanvasRenderer = _ctor (api.CanvasRenderer);
					__pragma__ ('<all>')
						__all__.AddEquation = AddEquation;
						__all__.AddOperation = AddOperation;
						__all__.AdditiveBlending = AdditiveBlending;
						__all__.AlphaFormat = AlphaFormat;
						__all__.AlwaysDepth = AlwaysDepth;
						__all__.AmbientLight = AmbientLight;
						__all__.AnimationClip = AnimationClip;
						__all__.AnimationMixer = AnimationMixer;
						__all__.AnimationObjectGroup = AnimationObjectGroup;
						__all__.AnimationUtils = AnimationUtils;
						__all__.ArcCurve = ArcCurve;
						__all__.ArrayCamera = ArrayCamera;
						__all__.ArrowHelper = ArrowHelper;
						__all__.Audio = Audio;
						__all__.AudioAnalyser = AudioAnalyser;
						__all__.AudioContext = AudioContext;
						__all__.AudioListener = AudioListener;
						__all__.AudioLoader = AudioLoader;
						__all__.AxisHelper = AxisHelper;
						__all__.BackSide = BackSide;
						__all__.BasicDepthPacking = BasicDepthPacking;
						__all__.BasicShadowMap = BasicShadowMap;
						__all__.BinaryTextureLoader = BinaryTextureLoader;
						__all__.Bone = Bone;
						__all__.BooleanKeyframeTrack = BooleanKeyframeTrack;
						__all__.BoundingBoxHelper = BoundingBoxHelper;
						__all__.Box2 = Box2;
						__all__.Box3 = Box3;
						__all__.BoxBufferGeometry = BoxBufferGeometry;
						__all__.BoxGeometry = BoxGeometry;
						__all__.BoxHelper = BoxHelper;
						__all__.BufferAttribute = BufferAttribute;
						__all__.BufferGeometry = BufferGeometry;
						__all__.BufferGeometryLoader = BufferGeometryLoader;
						__all__.ByteType = ByteType;
						__all__.Cache = Cache;
						__all__.Camera = Camera;
						__all__.CameraHelper = CameraHelper;
						__all__.CanvasRenderer = CanvasRenderer;
						__all__.CanvasTexture = CanvasTexture;
						__all__.CatmullRomCurve3 = CatmullRomCurve3;
						__all__.CineonToneMapping = CineonToneMapping;
						__all__.CircleBufferGeometry = CircleBufferGeometry;
						__all__.CircleGeometry = CircleGeometry;
						__all__.ClampToEdgeWrapping = ClampToEdgeWrapping;
						__all__.Clock = Clock;
						__all__.ClosedSplineCurve3 = ClosedSplineCurve3;
						__all__.Color = Color;
						__all__.ColorKeyframeTrack = ColorKeyframeTrack;
						__all__.CompressedTexture = CompressedTexture;
						__all__.CompressedTextureLoader = CompressedTextureLoader;
						__all__.ConeBufferGeometry = ConeBufferGeometry;
						__all__.ConeGeometry = ConeGeometry;
						__all__.CubeCamera = CubeCamera;
						__all__.CubeGeometry = CubeGeometry;
						__all__.CubeReflectionMapping = CubeReflectionMapping;
						__all__.CubeRefractionMapping = CubeRefractionMapping;
						__all__.CubeTexture = CubeTexture;
						__all__.CubeTextureLoader = CubeTextureLoader;
						__all__.CubeUVReflectionMapping = CubeUVReflectionMapping;
						__all__.CubeUVRefractionMapping = CubeUVRefractionMapping;
						__all__.CubicBezierCurve = CubicBezierCurve;
						__all__.CubicBezierCurve3 = CubicBezierCurve3;
						__all__.CubicInterpolant = CubicInterpolant;
						__all__.CullFaceBack = CullFaceBack;
						__all__.CullFaceFront = CullFaceFront;
						__all__.CullFaceFrontBack = CullFaceFrontBack;
						__all__.CullFaceNone = CullFaceNone;
						__all__.Curve = Curve;
						__all__.CurvePath = CurvePath;
						__all__.CustomBlending = CustomBlending;
						__all__.CylinderBufferGeometry = CylinderBufferGeometry;
						__all__.CylinderGeometry = CylinderGeometry;
						__all__.Cylindrical = Cylindrical;
						__all__.DataTexture = DataTexture;
						__all__.DataTextureLoader = DataTextureLoader;
						__all__.DefaultLoadingManager = DefaultLoadingManager;
						__all__.DepthFormat = DepthFormat;
						__all__.DepthStencilFormat = DepthStencilFormat;
						__all__.DepthTexture = DepthTexture;
						__all__.DirectionalLight = DirectionalLight;
						__all__.DirectionalLightHelper = DirectionalLightHelper;
						__all__.DirectionalLightShadow = DirectionalLightShadow;
						__all__.DiscreteInterpolant = DiscreteInterpolant;
						__all__.DodecahedronBufferGeometry = DodecahedronBufferGeometry;
						__all__.DodecahedronGeometry = DodecahedronGeometry;
						__all__.DoubleSide = DoubleSide;
						__all__.DstAlphaFactor = DstAlphaFactor;
						__all__.DstColorFactor = DstColorFactor;
						__all__.DynamicBufferAttribute = DynamicBufferAttribute;
						__all__.EdgesGeometry = EdgesGeometry;
						__all__.EdgesHelper = EdgesHelper;
						__all__.EllipseCurve = EllipseCurve;
						__all__.EqualDepth = EqualDepth;
						__all__.EquirectangularReflectionMapping = EquirectangularReflectionMapping;
						__all__.EquirectangularRefractionMapping = EquirectangularRefractionMapping;
						__all__.Euler = Euler;
						__all__.EventDispatcher = EventDispatcher;
						__all__.ExtrudeBufferGeometry = ExtrudeBufferGeometry;
						__all__.ExtrudeGeometry = ExtrudeGeometry;
						__all__.Face3 = Face3;
						__all__.Face4 = Face4;
						__all__.FaceColors = FaceColors;
						__all__.FaceNormalsHelper = FaceNormalsHelper;
						__all__.FileLoader = FileLoader;
						__all__.FlatShading = FlatShading;
						__all__.Float32Attribute = Float32Attribute;
						__all__.Float32BufferAttribute = Float32BufferAttribute;
						__all__.Float64Attribute = Float64Attribute;
						__all__.Float64BufferAttribute = Float64BufferAttribute;
						__all__.FloatType = FloatType;
						__all__.Fog = Fog;
						__all__.FogExp2 = FogExp2;
						__all__.Font = Font;
						__all__.FontLoader = FontLoader;
						__all__.FrontFaceDirectionCCW = FrontFaceDirectionCCW;
						__all__.FrontFaceDirectionCW = FrontFaceDirectionCW;
						__all__.FrontSide = FrontSide;
						__all__.Frustum = Frustum;
						__all__.GammaEncoding = GammaEncoding;
						__all__.Geometry = Geometry;
						__all__.GeometryIdCount = GeometryIdCount;
						__all__.GeometryUtils = GeometryUtils;
						__all__.GreaterDepth = GreaterDepth;
						__all__.GreaterEqualDepth = GreaterEqualDepth;
						__all__.GridHelper = GridHelper;
						__all__.Group = Group;
						__all__.HalfFloatType = HalfFloatType;
						__all__.HemisphereLight = HemisphereLight;
						__all__.HemisphereLightHelper = HemisphereLightHelper;
						__all__.IcosahedronBufferGeometry = IcosahedronBufferGeometry;
						__all__.IcosahedronGeometry = IcosahedronGeometry;
						__all__.ImageLoader = ImageLoader;
						__all__.ImageUtils = ImageUtils;
						__all__.ImmediateRenderObject = ImmediateRenderObject;
						__all__.InstancedBufferAttribute = InstancedBufferAttribute;
						__all__.InstancedBufferGeometry = InstancedBufferGeometry;
						__all__.InstancedInterleavedBuffer = InstancedInterleavedBuffer;
						__all__.Int16Attribute = Int16Attribute;
						__all__.Int16BufferAttribute = Int16BufferAttribute;
						__all__.Int32Attribute = Int32Attribute;
						__all__.Int32BufferAttribute = Int32BufferAttribute;
						__all__.Int8Attribute = Int8Attribute;
						__all__.Int8BufferAttribute = Int8BufferAttribute;
						__all__.IntType = IntType;
						__all__.InterleavedBuffer = InterleavedBuffer;
						__all__.InterleavedBufferAttribute = InterleavedBufferAttribute;
						__all__.Interpolant = Interpolant;
						__all__.InterpolateDiscrete = InterpolateDiscrete;
						__all__.InterpolateLinear = InterpolateLinear;
						__all__.InterpolateSmooth = InterpolateSmooth;
						__all__.JSONLoader = JSONLoader;
						__all__.KeyframeTrack = KeyframeTrack;
						__all__.LOD = LOD;
						__all__.LatheBufferGeometry = LatheBufferGeometry;
						__all__.LatheGeometry = LatheGeometry;
						__all__.Layers = Layers;
						__all__.LensFlare = LensFlare;
						__all__.LessDepth = LessDepth;
						__all__.LessEqualDepth = LessEqualDepth;
						__all__.Light = Light;
						__all__.LightShadow = LightShadow;
						__all__.Line = Line;
						__all__.Line3 = Line3;
						__all__.LineBasicMaterial = LineBasicMaterial;
						__all__.LineCurve = LineCurve;
						__all__.LineCurve3 = LineCurve3;
						__all__.LineDashedMaterial = LineDashedMaterial;
						__all__.LineLoop = LineLoop;
						__all__.LinePieces = LinePieces;
						__all__.LineSegments = LineSegments;
						__all__.LineStrip = LineStrip;
						__all__.LinearEncoding = LinearEncoding;
						__all__.LinearFilter = LinearFilter;
						__all__.LinearInterpolant = LinearInterpolant;
						__all__.LinearMipMapLinearFilter = LinearMipMapLinearFilter;
						__all__.LinearMipMapNearestFilter = LinearMipMapNearestFilter;
						__all__.LinearToneMapping = LinearToneMapping;
						__all__.Loader = Loader;
						__all__.LoadingManager = LoadingManager;
						__all__.LogLuvEncoding = LogLuvEncoding;
						__all__.LoopOnce = LoopOnce;
						__all__.LoopPingPong = LoopPingPong;
						__all__.LoopRepeat = LoopRepeat;
						__all__.LuminanceAlphaFormat = LuminanceAlphaFormat;
						__all__.LuminanceFormat = LuminanceFormat;
						__all__.MOUSE = MOUSE;
						__all__.Material = Material;
						__all__.MaterialLoader = MaterialLoader;
						__all__.Math = Math;
						__all__.Matrix3 = Matrix3;
						__all__.Matrix4 = Matrix4;
						__all__.MaxEquation = MaxEquation;
						__all__.Mesh = Mesh;
						__all__.MeshBasicMaterial = MeshBasicMaterial;
						__all__.MeshDepthMaterial = MeshDepthMaterial;
						__all__.MeshFaceMaterial = MeshFaceMaterial;
						__all__.MeshLambertMaterial = MeshLambertMaterial;
						__all__.MeshNormalMaterial = MeshNormalMaterial;
						__all__.MeshPhongMaterial = MeshPhongMaterial;
						__all__.MeshPhysicalMaterial = MeshPhysicalMaterial;
						__all__.MeshStandardMaterial = MeshStandardMaterial;
						__all__.MeshToonMaterial = MeshToonMaterial;
						__all__.MinEquation = MinEquation;
						__all__.MirroredRepeatWrapping = MirroredRepeatWrapping;
						__all__.MixOperation = MixOperation;
						__all__.MorphBlendMesh = MorphBlendMesh;
						__all__.MultiMaterial = MultiMaterial;
						__all__.MultiplyBlending = MultiplyBlending;
						__all__.MultiplyOperation = MultiplyOperation;
						__all__.NearestFilter = NearestFilter;
						__all__.NearestMipMapLinearFilter = NearestMipMapLinearFilter;
						__all__.NearestMipMapNearestFilter = NearestMipMapNearestFilter;
						__all__.NeverDepth = NeverDepth;
						__all__.NoBlending = NoBlending;
						__all__.NoColors = NoColors;
						__all__.NoToneMapping = NoToneMapping;
						__all__.NormalBlending = NormalBlending;
						__all__.NotEqualDepth = NotEqualDepth;
						__all__.NumberKeyframeTrack = NumberKeyframeTrack;
						__all__.Object3D = Object3D;
						__all__.ObjectLoader = ObjectLoader;
						__all__.OctahedronBufferGeometry = OctahedronBufferGeometry;
						__all__.OctahedronGeometry = OctahedronGeometry;
						__all__.OneFactor = OneFactor;
						__all__.OneMinusDstAlphaFactor = OneMinusDstAlphaFactor;
						__all__.OneMinusDstColorFactor = OneMinusDstColorFactor;
						__all__.OneMinusSrcAlphaFactor = OneMinusSrcAlphaFactor;
						__all__.OneMinusSrcColorFactor = OneMinusSrcColorFactor;
						__all__.OrthographicCamera = OrthographicCamera;
						__all__.PCFShadowMap = PCFShadowMap;
						__all__.PCFSoftShadowMap = PCFSoftShadowMap;
						__all__.ParametricBufferGeometry = ParametricBufferGeometry;
						__all__.ParametricGeometry = ParametricGeometry;
						__all__.Particle = Particle;
						__all__.ParticleBasicMaterial = ParticleBasicMaterial;
						__all__.ParticleSystem = ParticleSystem;
						__all__.ParticleSystemMaterial = ParticleSystemMaterial;
						__all__.Path = Path;
						__all__.PerspectiveCamera = PerspectiveCamera;
						__all__.Plane = Plane;
						__all__.PlaneBufferGeometry = PlaneBufferGeometry;
						__all__.PlaneGeometry = PlaneGeometry;
						__all__.PointCloud = PointCloud;
						__all__.PointCloudMaterial = PointCloudMaterial;
						__all__.PointLight = PointLight;
						__all__.PointLightHelper = PointLightHelper;
						__all__.Points = Points;
						__all__.PointsMaterial = PointsMaterial;
						__all__.PolarGridHelper = PolarGridHelper;
						__all__.PolyhedronBufferGeometry = PolyhedronBufferGeometry;
						__all__.PolyhedronGeometry = PolyhedronGeometry;
						__all__.PositionalAudio = PositionalAudio;
						__all__.Projector = Projector;
						__all__.PropertyBinding = PropertyBinding;
						__all__.PropertyMixer = PropertyMixer;
						__all__.QuadraticBezierCurve = QuadraticBezierCurve;
						__all__.QuadraticBezierCurve3 = QuadraticBezierCurve3;
						__all__.Quaternion = Quaternion;
						__all__.QuaternionKeyframeTrack = QuaternionKeyframeTrack;
						__all__.QuaternionLinearInterpolant = QuaternionLinearInterpolant;
						__all__.REVISION = REVISION;
						__all__.RGBADepthPacking = RGBADepthPacking;
						__all__.RGBAFormat = RGBAFormat;
						__all__.RGBA_PVRTC_2BPPV1_Format = RGBA_PVRTC_2BPPV1_Format;
						__all__.RGBA_PVRTC_4BPPV1_Format = RGBA_PVRTC_4BPPV1_Format;
						__all__.RGBA_S3TC_DXT1_Format = RGBA_S3TC_DXT1_Format;
						__all__.RGBA_S3TC_DXT3_Format = RGBA_S3TC_DXT3_Format;
						__all__.RGBA_S3TC_DXT5_Format = RGBA_S3TC_DXT5_Format;
						__all__.RGBDEncoding = RGBDEncoding;
						__all__.RGBEEncoding = RGBEEncoding;
						__all__.RGBEFormat = RGBEFormat;
						__all__.RGBFormat = RGBFormat;
						__all__.RGBM16Encoding = RGBM16Encoding;
						__all__.RGBM7Encoding = RGBM7Encoding;
						__all__.RGB_ETC1_Format = RGB_ETC1_Format;
						__all__.RGB_PVRTC_2BPPV1_Format = RGB_PVRTC_2BPPV1_Format;
						__all__.RGB_PVRTC_4BPPV1_Format = RGB_PVRTC_4BPPV1_Format;
						__all__.RGB_S3TC_DXT1_Format = RGB_S3TC_DXT1_Format;
						__all__.RawShaderMaterial = RawShaderMaterial;
						__all__.Ray = Ray;
						__all__.Raycaster = Raycaster;
						__all__.RectAreaLight = RectAreaLight;
						__all__.RectAreaLightHelper = RectAreaLightHelper;
						__all__.ReinhardToneMapping = ReinhardToneMapping;
						__all__.RepeatWrapping = RepeatWrapping;
						__all__.ReverseSubtractEquation = ReverseSubtractEquation;
						__all__.RingBufferGeometry = RingBufferGeometry;
						__all__.RingGeometry = RingGeometry;
						__all__.Scene = Scene;
						__all__.SceneUtils = SceneUtils;
						__all__.ShaderChunk = ShaderChunk;
						__all__.ShaderLib = ShaderLib;
						__all__.ShaderMaterial = ShaderMaterial;
						__all__.ShadowMaterial = ShadowMaterial;
						__all__.Shape = Shape;
						__all__.ShapeBufferGeometry = ShapeBufferGeometry;
						__all__.ShapeGeometry = ShapeGeometry;
						__all__.ShapePath = ShapePath;
						__all__.ShapeUtils = ShapeUtils;
						__all__.ShortType = ShortType;
						__all__.Skeleton = Skeleton;
						__all__.SkeletonHelper = SkeletonHelper;
						__all__.SkinnedMesh = SkinnedMesh;
						__all__.SmoothShading = SmoothShading;
						__all__.Sphere = Sphere;
						__all__.SphereBufferGeometry = SphereBufferGeometry;
						__all__.SphereGeometry = SphereGeometry;
						__all__.Spherical = Spherical;
						__all__.SphericalReflectionMapping = SphericalReflectionMapping;
						__all__.Spline = Spline;
						__all__.SplineCurve = SplineCurve;
						__all__.SplineCurve3 = SplineCurve3;
						__all__.SpotLight = SpotLight;
						__all__.SpotLightHelper = SpotLightHelper;
						__all__.SpotLightShadow = SpotLightShadow;
						__all__.Sprite = Sprite;
						__all__.SpriteMaterial = SpriteMaterial;
						__all__.SrcAlphaFactor = SrcAlphaFactor;
						__all__.SrcAlphaSaturateFactor = SrcAlphaSaturateFactor;
						__all__.SrcColorFactor = SrcColorFactor;
						__all__.StereoCamera = StereoCamera;
						__all__.StringKeyframeTrack = StringKeyframeTrack;
						__all__.SubtractEquation = SubtractEquation;
						__all__.SubtractiveBlending = SubtractiveBlending;
						__all__.TetrahedronBufferGeometry = TetrahedronBufferGeometry;
						__all__.TetrahedronGeometry = TetrahedronGeometry;
						__all__.TextBufferGeometry = TextBufferGeometry;
						__all__.TextGeometry = TextGeometry;
						__all__.Texture = Texture;
						__all__.TextureLoader = TextureLoader;
						__all__.TorusBufferGeometry = TorusBufferGeometry;
						__all__.TorusGeometry = TorusGeometry;
						__all__.TorusKnotBufferGeometry = TorusKnotBufferGeometry;
						__all__.TorusKnotGeometry = TorusKnotGeometry;
						__all__.Triangle = Triangle;
						__all__.TriangleFanDrawMode = TriangleFanDrawMode;
						__all__.TriangleStripDrawMode = TriangleStripDrawMode;
						__all__.TrianglesDrawMode = TrianglesDrawMode;
						__all__.TubeBufferGeometry = TubeBufferGeometry;
						__all__.TubeGeometry = TubeGeometry;
						__all__.UVMapping = UVMapping;
						__all__.Uint16Attribute = Uint16Attribute;
						__all__.Uint16BufferAttribute = Uint16BufferAttribute;
						__all__.Uint32Attribute = Uint32Attribute;
						__all__.Uint32BufferAttribute = Uint32BufferAttribute;
						__all__.Uint8Attribute = Uint8Attribute;
						__all__.Uint8BufferAttribute = Uint8BufferAttribute;
						__all__.Uint8ClampedAttribute = Uint8ClampedAttribute;
						__all__.Uint8ClampedBufferAttribute = Uint8ClampedBufferAttribute;
						__all__.Uncharted2ToneMapping = Uncharted2ToneMapping;
						__all__.Uniform = Uniform;
						__all__.UniformsLib = UniformsLib;
						__all__.UniformsUtils = UniformsUtils;
						__all__.UnsignedByteType = UnsignedByteType;
						__all__.UnsignedInt248Type = UnsignedInt248Type;
						__all__.UnsignedIntType = UnsignedIntType;
						__all__.UnsignedShort4444Type = UnsignedShort4444Type;
						__all__.UnsignedShort5551Type = UnsignedShort5551Type;
						__all__.UnsignedShort565Type = UnsignedShort565Type;
						__all__.UnsignedShortType = UnsignedShortType;
						__all__.Vector3 = Vector3;
						__all__.VectorKeyframeTrack = VectorKeyframeTrack;
						__all__.Vertex = Vertex;
						__all__.VertexColors = VertexColors;
						__all__.VertexNormalsHelper = VertexNormalsHelper;
						__all__.VideoTexture = VideoTexture;
						__all__.WebGLRenderTarget = WebGLRenderTarget;
						__all__.WebGLRenderTargetCube = WebGLRenderTargetCube;
						__all__.WebGLRenderer = WebGLRenderer;
						__all__.WireframeGeometry = WireframeGeometry;
						__all__.WireframeHelper = WireframeHelper;
						__all__.WrapAroundEnding = WrapAroundEnding;
						__all__.XHRLoader = XHRLoader;
						__all__.ZeroCurvatureEnding = ZeroCurvatureEnding;
						__all__.ZeroFactor = ZeroFactor;
						__all__.ZeroSlopeEnding = ZeroSlopeEnding;
						__all__._ctor = _ctor;
						__all__.api = api;
						__all__.sRGBEncoding = sRGBEncoding;
					__pragma__ ('</all>')
				}
			}
		}
	);
	__nest__ (
		__all__,
		'random', {
			__all__: {
				__inited__: false,
				__init__: function (__all__) {
					var _array = function () {
						var __accu0__ = [];
						for (var i = 0; i < 624; i++) {
							__accu0__.append (0);
						}
						return __accu0__;
					} ();
					var _index = 0;
					var _bitmask1 = Math.pow (2, 32) - 1;
					var _bitmask2 = Math.pow (2, 31);
					var _bitmask3 = Math.pow (2, 31) - 1;
					var _fill_array = function () {
						for (var i = 0; i < 624; i++) {
							var y = (_array [i] & _bitmask2) + (_array [__mod__ (i + 1, 624)] & _bitmask3);
							_array [i] = _array [__mod__ (i + 397, 624)] ^ y >> 1;
							if (__mod__ (y, 2) != 0) {
								_array [i] ^= 2567483615;
							}
						}
					};
					var _random_integer = function () {
						if (_index == 0) {
							_fill_array ();
						}
						var y = _array [_index];
						y ^= y >> 11;
						y ^= y << 7 & 2636928640;
						y ^= y << 15 & 4022730752;
						y ^= y >> 18;
						_index = __mod__ (_index + 1, 624);
						return y;
					};
					var seed = function (x) {
						if (typeof x == 'undefined' || (x != null && x .hasOwnProperty ("__kwargtrans__"))) {;
							var x = int (_bitmask3 * Math.random ());
						};
						_array [0] = x;
						for (var i = 1; i < 624; i++) {
							_array [i] = (1812433253 * _array [i - 1] ^ (_array [i - 1] >> 30) + i) & _bitmask1;
						}
					};
					var randint = function (a, b) {
						return a + __mod__ (_random_integer (), (b - a) + 1);
					};
					var choice = function (seq) {
						return seq [randint (0, len (seq) - 1)];
					};
					var random = function () {
						return _random_integer () / _bitmask3;
					};
					seed ();
					__pragma__ ('<all>')
						__all__._array = _array;
						__all__._bitmask1 = _bitmask1;
						__all__._bitmask2 = _bitmask2;
						__all__._bitmask3 = _bitmask3;
						__all__._fill_array = _fill_array;
						__all__._index = _index;
						__all__._random_integer = _random_integer;
						__all__.choice = choice;
						__all__.randint = randint;
						__all__.random = random;
						__all__.seed = seed;
					__pragma__ ('</all>')
				}
			}
		}
	);
	__nest__ (
		__all__,
		'units', {
			__all__: {
				__inited__: false,
				__init__: function (__all__) {
					var random = {};
					__nest__ (random, '', __init__ (__world__.random));
					var three = __init__ (__world__.org.threejs);
					var wrap = __init__ (__world__.utils).wrap;
					var AABB = __init__ (__world__.utils).AABB;
					var Unit = __class__ ('Unit', [object], {
						get __init__ () {return __get__ (this, function (self) {
							self.geo = null;
							self.momentum = three.Vector3 (0, 0, 0);
						});},
						get get_position () {return __get__ (this, function (self) {
							return self.geo.position;
						});},
						get py_update () {return __get__ (this, function (self, t) {
							var current_pos = self.geo.position;
							var move = three.Vector3 ().copy (self.momentum);
							move.multiplyScalar (t);
							self.geo.matrixWorld.setPosition (current_pos.add (move));
						});}
					});
					Object.defineProperty (Unit, 'position', property.call (Unit, Unit.get_position));;
					var Ship = __class__ ('Ship', [Unit], {
						ROTATE_SPEED: 2.1,
						THRUST: 0.075,
						get __init__ () {return __get__ (this, function (self, keyboard, game) {
							Unit.__init__ (self);
							self.keyboard = keyboard;
							self.geo = three.Mesh (three.BoxGeometry (2, 3, 2), three.MeshNormalMaterial ());
							var exhaust = three.Mesh (three.BoxGeometry (1, 2, 1), three.MeshBasicMaterial (dict ({'color': 16776960})));
							self.geo.add (exhaust);
							exhaust.translateY (-(2));
							self.exhaust = exhaust;
							self.momentum = three.Vector3 (0, 0, 0);
							self.keyboard = keyboard;
							self.bbox = AABB (2, 2, self.geo.position);
							self.game = game;
						});},
						get py_update () {return __get__ (this, function (self, t) {
							var thrust = self.keyboard.get_axis ('thrust');
							self.geo.rotateZ (((self.keyboard.get_axis ('spin') * self.ROTATE_SPEED) * t) * -(1));
							if (thrust > 0) {
								var thrust_amt = thrust * self.THRUST;
								self.momentum = self.momentum.add (self.heading.multiplyScalar (thrust_amt));
							}
							Unit.py_update (self, t);
							self.exhaust.visible = thrust > 0;
							if (self.keyboard.get_axis ('fire') >= 1) {
								var mo = three.Vector3 ().copy (self.momentum).multiplyScalar (t);
								self.game.fire (self.geo.position, self.heading, mo);
								self.keyboard.py_clear ('fire');
							}
							self.bbox.py_update (self.position);
						});},
						get get_heading () {return __get__ (this, function (self) {
							return three.Vector3 (self.geo.matrixWorld.elements [4], self.geo.matrixWorld.elements [5], self.geo.matrixWorld.elements [6]);
						});}
					});
					Object.defineProperty (Ship, 'heading', property.call (Ship, Ship.get_heading));;
					var Asteroid = __class__ ('Asteroid', [Unit], {
						get __init__ () {return __get__ (this, function (self, radius, pos) {
							Unit.__init__ (self);
							self.radius = radius;
							self.geo = three.Mesh (three.SphereGeometry (self.radius), three.MeshNormalMaterial ());
							self.geo.position.set (pos.x, pos.y, pos.z);
							self.bbox = AABB (self.radius * 2, self.radius * 2, self.geo.position);
							self.momentum = three.Vector3 (0, 0, 0);
						});},
						get py_update () {return __get__ (this, function (self, t) {
							Unit.py_update (self, t);
							self.bbox.py_update (self.position);
						});}
					});
					var Bullet = __class__ ('Bullet', [object], {
						EXPIRES: 1,
						RESET_POS: three.Vector3 (0, 0, 1000),
						BULLET_SPEED: 50,
						get __init__ () {return __get__ (this, function (self) {
							self.vector = three.Vector3 (0, 0, 0);
							self.geo = three.Mesh (three.BoxGeometry (0.25, 0.25, 0.25), three.MeshBasicMaterial (dict ({'color': 16777215})));
							self.lifespan = 0;
							self.momentum = three.Vector3 (0, 0, 0);
							self.reset ();
						});},
						get py_update () {return __get__ (this, function (self, t) {
							if (self.geo.position.z < 1000) {
								self.lifespan += t;
								if (self.lifespan > self.EXPIRES) {
									self.reset ();
									return ;
								}
								var delta = three.Vector3 ().copy (self.vector);
								delta.multiplyScalar (self.BULLET_SPEED * t);
								delta.add (self.momentum);
								var current_pos = self.geo.position.add (delta);
								self.geo.position.set (current_pos.x, current_pos.y, current_pos.z);
								wrap (self.geo);
							}
						});},
						get reset () {return __get__ (this, function (self) {
							self.lifespan = 0;
							self.momentum = three.Vector3 (0, 0, 0);
							self.geo.position.set (self.RESET_POS.x, self.RESET_POS.y, self.RESET_POS.z);
						});},
						get get_position () {return __get__ (this, function (self) {
							return self.geo.position;
						});}
					});
					Object.defineProperty (Bullet, 'position', property.call (Bullet, Bullet.get_position));;
					__pragma__ ('<use>' +
						'org.threejs' +
						'random' +
						'utils' +
					'</use>')
					__pragma__ ('<all>')
						__all__.AABB = AABB;
						__all__.Asteroid = Asteroid;
						__all__.Bullet = Bullet;
						__all__.Ship = Ship;
						__all__.Unit = Unit;
						__all__.three = three;
						__all__.wrap = wrap;
					__pragma__ ('</all>')
				}
			}
		}
	);
	__nest__ (
		__all__,
		'utils', {
			__all__: {
				__inited__: false,
				__init__: function (__all__) {
					var three = __init__ (__world__.org.threejs);
					var pad_wrap = function (min, max, val) {
						if (val < min) {
							return max;
						}
						if (val > max) {
							return min;
						}
						return val;
					};
					var wrap = function (obj) {
						var WRAP = 30;
						var NWRAP = -(30);
						var __left0__ = tuple ([obj.position.x, obj.position.y, obj.position.z]);
						var x = __left0__ [0];
						var y = __left0__ [1];
						var z = __left0__ [2];
						var x = pad_wrap (NWRAP, WRAP, x);
						var y = pad_wrap (NWRAP, WRAP, y);
						obj.position.set (x, y, z);
					};
					var clamp = function (val, low, high) {
						return max (min (val, high), low);
					};
					var sign = function (val) {
						if (val > 0) {
							return 1;
						}
						if (val < 0) {
							return -(1);
						}
						return 0;
					};
					var now = function () {
						return new Date;
					};
					var set_element = function (id, value) {
						document.getElementById (id).innerHTML = value;
					};
					var AABB = __class__ ('AABB', [object], {
						get __init__ () {return __get__ (this, function (self, width, height, center) {
							self.hw = width / 2.0;
							self.hh = width / 2.0;
							self.position = center;
						});},
						get contains () {return __get__ (this, function (self, item) {
							var x = self.position.x;
							var y = self.position.y;
							var h = self.hh;
							var w = self.hw;
							return item.x > x - w && item.x < x + w && item.y > y - h && item.y < y + h;
						});},
						get py_update () {return __get__ (this, function (self, pos) {
							self.position = pos;
						});}
					});
					__pragma__ ('<use>' +
						'org.threejs' +
					'</use>')
					__pragma__ ('<all>')
						__all__.AABB = AABB;
						__all__.clamp = clamp;
						__all__.now = now;
						__all__.pad_wrap = pad_wrap;
						__all__.set_element = set_element;
						__all__.sign = sign;
						__all__.three = three;
						__all__.wrap = wrap;
					__pragma__ ('</all>')
				}
			}
		}
	);
	(function () {
		var random = {};
		__nest__ (random, '', __init__ (__world__.random));
		var three =  __init__ (__world__.org.threejs);
		var Keyboard = __init__ (__world__.controls).Keyboard;
		var ControlAxis = __init__ (__world__.controls).ControlAxis;
		var Ship = __init__ (__world__.units).Ship;
		var Asteroid = __init__ (__world__.units).Asteroid;
		var Bullet = __init__ (__world__.units).Bullet;
		var wrap = __init__ (__world__.utils).wrap;
		var now = __init__ (__world__.utils).now;
		var pad_wrap = __init__ (__world__.utils).pad_wrap;
		var Graphics = __class__ ('Graphics', [object], {
			get __init__ () {return __get__ (this, function (self, w, h, canvas) {
				self.width = w;
				self.height = h;
				self.scene = three.Scene ();
				self.camera = three.PerspectiveCamera (70, self.width / self.height, 1, 500);
				self.camera.position.set (0, 0, 50);
				self.camera.lookAt (self.scene.position);
				self.renderer = three.WebGLRenderer (dict ({'Antialias': true}));
				self.renderer.setSize (self.width, self.height);
				canvas.appendChild (self.renderer.domElement);
			});},
			get render () {return __get__ (this, function (self) {
				self.renderer.render (self.scene, self.camera);
			});},
			get add () {return __get__ (this, function (self, item) {
				self.scene.add (item.geo);
			});}
		});
		var Game = __class__ ('Game', [object], {
			get __init__ () {return __get__ (this, function (self, canvas) {
				self.keyboard = Keyboard ();
				self.graphics = Graphics (window.innerWidth, window.innerHeight, canvas);
				self.create_controls ();
				self.ship = null;
				self.bullets = list ([]);
				self.asteroids = list ([]);
				self.setup ();
				self.last_frame = now ();
			});},
			get create_controls () {return __get__ (this, function (self) {
				self.keyboard.add_handler ('spin', ControlAxis ('s', 'a', __kwargtrans__ ({attack: 1, decay: 0.6})));
				self.keyboard.add_handler ('thrust', ControlAxis ('w', 'z', __kwargtrans__ ({attack: 0.75, decay: 2, deadzone: 0.1})));
				self.keyboard.add_handler ('fire', ControlAxis ('q', 'b', __kwargtrans__ ({attack: 10})));
				document.onkeydown = self.keyboard.key_down;
				document.onkeyup = self.keyboard.key_up;
			});},
			get setup () {return __get__ (this, function (self) {
				self.ship = Ship (self.keyboard, self);
				self.graphics.add (self.ship);
				var rsign = function () {
					if (random.random () < 0.5) {
						return -(1);
					}
					return 1;
				};
				for (var a = 0; a < 10; a++) {
					var x = random.randint (-(30), 30);
					var y = random.randint (-(30), 30);
					var z = 0;
					var r = (random.random () + 1.0) * 2.5;
					var asteroid = Asteroid (r, three.Vector3 (x, y, z));
					var mx = 2.0;
					var my = 2.0;
					asteroid.momentum = three.Vector3 (mx, my, 0);
					self.graphics.add (asteroid);
					self.asteroids.append (asteroid);
				}
				for (var b = 0; b < 8; b++) {
					var bullet = Bullet ();
					self.graphics.add (bullet);
					self.bullets.append (bullet);
				}
			});},
			get tick () {return __get__ (this, function (self) {
				if (len (self.asteroids) == 0) {
					print ('GAME OVER');
					document.getElementById ('ZZ').innerHTML = '<h1>GAME OVER</h1>';
					return ;
				}
				requestAnimationFrame (self.tick);
				var t = (now () - self.last_frame) / 1000.0;
				self.keyboard.py_update (t);
				var dead = list ([]);
				for (var b of self.bullets) {
					if (b.position.z < 1000) {
						for (var a of self.asteroids) {
							if (a.bbox.contains (b.position)) {
								var d = a.geo.position.distanceTo (b.position);
								if (d < a.radius) {
									b.reset ();
									dead.append (a);
								}
							}
						}
					}
				}
				for (var d of dead) {
					self.asteroids.remove (d);
					d.geo.visible = false;
					if (d.radius > 1.5) {
						var new_asteroids = random.randint (2, 5);
						for (var n = 0; n < new_asteroids; n++) {
							var new_a = Asteroid ((d.radius + 1.0) / new_asteroids, d.position);
							var xr = random.random ();
							var yr = random.random ();
							new_a.momentum = three.Vector3 ().copy (d.momentum);
							new_a.momentum.add (three.Vector3 (xr, yr, 0));
							self.graphics.add (new_a);
							self.asteroids.append (new_a);
						}
					}
				}
				for (var b of self.bullets) {
					b.py_update (t);
				}
				self.ship.py_update (t);
				wrap (self.ship.geo);
				for (var item of self.asteroids) {
					item.py_update (t);
					wrap (item.geo);
				}
				self.graphics.render ();
				self.last_frame = now ();
			});},
			get fire () {return __get__ (this, function (self, pos, vector, momentum, t) {
				for (var each_bullet of self.bullets) {
					if (each_bullet.geo.position.z >= 1000) {
						each_bullet.geo.position.set (pos.x, pos.y, pos.z);
						each_bullet.vector = vector;
						each_bullet.lifespan = 0;
						each_bullet.momentum = three.Vector3 ().copy (momentum).multiplyScalar (0.66);
						return ;
					}
				}
			});}
		});
		var EventQueue = __class__ ('EventQueue', [object], {
			get __init__ () {return __get__ (this, function (self) {
				self.events = dict ({});
			});},
			get add_event () {return __get__ (this, function (self, py_name, event) {
				self.events [py_name] = event;
			});},
			get remove_event () {return __get__ (this, function (self, py_name) {
				self.events.py_pop (py_name, null);
			});}
		});
		var Event = __class__ ('Event', [object], {
			get __init__ () {return __get__ (this, function (self, py_name) {
				self.py_name = py_name;
				self.handlers = dict ({});
			});},
			get subscribe () {return __get__ (this, function (self, py_name, handler) {
				self.handlers [py_name] = handler;
			});},
			get unsubscribe () {return __get__ (this, function (self, py_name) {
				self.handlers.py_pop (py_name, null);
			});},
			get fire () {return __get__ (this, function (self) {
				var args = tuple ([].slice.apply (arguments).slice (1));
				for (var [k, v] of self.handlers.py_items ()) {
					v (...args);
				}
			});}
		});
		var canvas = document.getElementById ('game_canvas');
		var game = Game (canvas);
		game.tick ();
		__pragma__ ('<use>' +
			'controls' +
			'org.threejs' +
			'random' +
			'units' +
			'utils' +
		'</use>')
		__pragma__ ('<all>')
			__all__.Asteroid = Asteroid;
			__all__.Bullet = Bullet;
			__all__.ControlAxis = ControlAxis;
			__all__.Event = Event;
			__all__.EventQueue = EventQueue;
			__all__.Game = Game;
			__all__.Graphics = Graphics;
			__all__.Keyboard = Keyboard;
			__all__.Ship = Ship;
			__all__.canvas = canvas;
			__all__.game = game;
			__all__.now = now;
			__all__.pad_wrap = pad_wrap;
			__all__.wrap = wrap;
		__pragma__ ('</all>')
	}) ();
   return __all__;
}
window ['pysteroids'] = pysteroids ();

//# sourceMappingURL=extra/sourcemap/pysteroids.js.map
