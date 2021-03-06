﻿Ext.app.ComponentEditor = function (componentStore, localDeveloperStore, validateWidgetUrl)
{
	var mediator = Ext.app.Mediator;
	var removeGadgetFromStores = function (rec)
	{
		var id = rec.get("ID");
		var index = componentStore.find("ID", id);
		componentStore.removeAt(index);
		componentStore.sync();
		if (localDeveloperStore)
		{
			index = localDeveloperStore.find("ID", id);
			localDeveloperStore.removeAt(index);
		}
	};

	var componentRemove = function (rec)
	{
		Ext.Msg.show(
		{
			title: 'Please configm',
			msg: 'Are you to delete your gadget?',
			buttons: Ext.Msg.YESNO,
			icon: Ext.Msg.QUESTION,
			fn: function (btn)
			{
				if (btn == "yes")
				{
					removeGadgetFromStores(rec);
				}
			}
		});
	};

	var createOrEditGadget = function (record, dashboard)
	{
		Ext.app.ComponentEditor.gadgetWindow = new Ext.window.Window(
		{
			width: 600,
			height: 400,
			title: 'Add new gadget',
			modal: true,
			closable: false,
			processGadgetSubmit: function (e)
			{
				var result = $.parseJSON(e.originalEvent.data);
				if (!result.apiMethod)
				{
					$(window).unbind("message", Ext.app.ComponentEditor.gadgetWindow.processGadgetSubmit);
					if (result.validationResult)
					{
						var widget =
						{
							ID: result.ID,
							Manifest: result.manifest,
							Name: result.widget.ModulePrefs.Title,
							IconUrl: result.widget.ModulePrefs.ThumbnailUrl,
							IsOwner: true,
							Options:
							{
								Height: result.widget.ModulePrefs.Height || "300px",
								Collapsed: false,
								Title: result.widget.ModulePrefs.Title,
								IFrame: true,
								Url: result.widget.Content.Href,
								PreventExpandable: false,
								IconUrl: result.widget.ModulePrefs.ThumbnailUrl
							}
						};
						if (record)
						{
							removeGadgetFromStores(record);
						}

						if (localDeveloperStore)
						{
							localDeveloperStore.add(widget);
							localDeveloperStore.sync();
						}
						componentStore.add(widget);
						componentStore.sync();

						Ext.Msg.alert("Status", "Widget succesfully " + (record ? "modified" : "created"));
						Ext.app.ComponentEditor.gadgetWindow.closeAndCleanup();
					}
					else
					{
						Ext.Msg.show(
						{
							title: "Error",
							msg: result.messages.join('<br/>'),
							buttons: Ext.Msg.OK,
							icon: Ext.Msg.ERROR
						});
					}
				}
			},
			closeAndCleanup: function()
			{
				$(window).unbind("message", Ext.app.ComponentEditor.gadgetWindow.processGadgetSubmit);
				mediator.un("componentCreate", createOrEditGadget);
				mediator.un("componentModify", createOrEditGadget);
				mediator.un("componentRemove", componentRemove);
				Ext.app.ComponentEditor.gadgetWindow.close();
				Ext.app.ComponentEditor.gadgetWindow = null;
			},
			items:
			[
				{
					xtype: 'form',
					layout: 'fit',
					standardSubmit: true,
					url: validateWidgetUrl,
					items:
					[
						{
							xtype: 'textarea',
							hideLabel: true,
							style: 'width:100%;',
							height: 350,
							value: record ? record.data.Manifest : "",
							name: 'widgetXml'
						}
					]
				},
				{
					xtype: 'container',
					width: 0,
					height: 0,
					html: '<iframe id="widgetSumbitFrame" name="widgetSumbitFrame"></iframe>'
				}
			],
			buttons:
			[
				{
					text: 'Validate & ' + (record ? "Update" : "Add"),
					handler: function ()
					{
						$(window).bind("message", Ext.app.ComponentEditor.gadgetWindow.processGadgetSubmit);
						this.up().up().down('form').submit({ target: 'widgetSumbitFrame' });
					}
				},
				{
					text: 'Cancel',
					handler: function ()
					{
						Ext.app.ComponentEditor.gadgetWindow.closeAndCleanup();
					}
				}
			]
		});
		Ext.app.ComponentEditor.gadgetWindow.show();
	};
	mediator.on("componentCreate", createOrEditGadget);
	mediator.on("componentModify", createOrEditGadget);
	mediator.on("componentRemove", componentRemove);

	this.destroy = function ()
	{
		if (Ext.app.ComponentEditor.gadgetWindow)
		{
			Ext.app.ComponentEditor.gadgetWindow.closeAndCleanup();
		}
	};
};